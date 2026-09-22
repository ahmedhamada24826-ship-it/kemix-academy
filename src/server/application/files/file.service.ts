import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  FileAssetDto,
  RequestUploadIntentInput,
  RegisterFileAssetInput,
} from "@/server/domain/files/file.types";
import { PresignedUploadTicket } from "@/server/domain/storage/storage.types";
import { IStorageService } from "@/server/domain/storage/storage-service.interface";
import { storageService as defaultStorageService } from "@/server/infrastructure/storage/s3-storage.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IFileService } from "./file.service.interface";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";
import { hasPermission } from "@/server/domain/security/rbac.types";

export class FileService implements IFileService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly storage: IStorageService = defaultStorageService,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  private async validateAttachmentScope(courseId?: string, lessonId?: string): Promise<void> {
    if (lessonId && !courseId) {
      throw new Error("courseId is required when attaching a file to a lesson");
    }

    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { section: { select: { courseId: true } } },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      if (lesson.section.courseId !== courseId) {
        throw new Error("Lesson does not belong to the specified course");
      }
      return;
    }

    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, instructorId: true },
      });

      if (!course) {
        throw new Error("Course not found");
      }
    }
  }

  async requestUploadIntent(
    user: AuthenticatedUser,
    input: RequestUploadIntentInput
  ): Promise<PresignedUploadTicket> {
    const canUpload = hasPermission(user.role, "media:upload");
    if (!canUpload) {
      throw new Error("Forbidden: You do not have permission to upload media");
    }

    await this.validateAttachmentScope(input.courseId, input.lessonId);

    if (input.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true, instructorId: true },
      });
      if (!course) {
        throw new Error("Course not found");
      }
      if (!this.accessService.canManageCourse(user, course)) {
        throw new Error("Forbidden: You cannot upload files to this course");
      }
    }

    const bucketType = input.visibility === "PUBLIC" ? "public" : "protected";
    const uniqueId = crypto.randomUUID();
    const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${user.id}/${uniqueId}-${sanitizedFilename}`;

    return this.storage.getPresignedUploadUrl({
      bucketType,
      key,
      mimeType: input.mimeType,
      maxSizeBytes: input.size,
      expiresInSeconds: 900,
    });
  }

  async registerFileAsset(
    user: AuthenticatedUser,
    input: RegisterFileAssetInput
  ): Promise<FileAssetDto & { publicUrl?: string }> {
    const canUpload = hasPermission(user.role, "media:upload");
    if (!canUpload) {
      throw new Error("Forbidden: You do not have permission to register media assets");
    }

    await this.validateAttachmentScope(input.courseId, input.lessonId);

    if (input.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true, instructorId: true },
      });
      if (!course) {
        throw new Error("Course not found");
      }
      if (!this.accessService.canManageCourse(user, course)) {
        throw new Error("Forbidden: You cannot attach files to this course");
      }
    }

    const bucketType = input.visibility === "PUBLIC" ? "public" : "protected";
    const objectExists = await this.storage.checkObjectExists(bucketType, input.storageKey);
    if (!objectExists) {
      throw new Error("Uploaded object was not found in storage; file was not registered");
    }

    const asset = await this.prisma.fileAsset.create({
      data: {
        storageKey: input.storageKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        category: input.category,
        visibility: input.visibility ?? "PROTECTED",
        uploadedById: user.id,
        courseId: input.courseId,
        lessonId: input.lessonId,
      },
    });

    return {
      ...asset,
      publicUrl:
        asset.visibility === "PUBLIC" ? this.storage.getPublicUrl(asset.storageKey) : undefined,
    };
  }

  async getSignedAccessUrl(
    fileAssetId: string,
    user?: AuthenticatedUser | null
  ): Promise<{ url: string; isDirectPublic: boolean }> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileAssetId },
      include: {
        course: {
          select: { id: true, status: true, instructorId: true },
        },
        lesson: {
          include: {
            section: {
              include: {
                course: {
                  select: { id: true, status: true, instructorId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new Error("File asset not found");
    }

    // If file is public, return public URL directly
    if (asset.visibility === "PUBLIC") {
      return {
        url: this.storage.getPublicUrl(asset.storageKey),
        isDirectPublic: true,
      };
    }

    // Protected file access checks
    if (!user) {
      // Check if attached to a free preview lesson
      if (asset.lesson && asset.lesson.isFreePreview && asset.lesson.isPublished) {
        const url = await this.storage.getPresignedDownloadUrl({
          bucketType: "protected",
          key: asset.storageKey,
          expiresInSeconds: 3600,
          downloadFilename: asset.originalName,
        });
        return { url, isDirectPublic: false };
      }
      throw new Error("Authentication required to access protected file");
    }

    if (user.role === "ADMIN" || asset.uploadedById === user.id) {
      const url = await this.storage.getPresignedDownloadUrl({
        bucketType: "protected",
        key: asset.storageKey,
        expiresInSeconds: 3600,
        downloadFilename: asset.originalName,
      });
      return { url, isDirectPublic: false };
    }

    // Check course enrollment/access
    if (asset.lesson) {
      const decision = await this.accessService.canAccessLesson(user, asset.lesson);
      if (!decision.allowed) {
        throw new Error("Forbidden: You do not have access to this lesson's files");
      }
    } else if (asset.course) {
      const decision = await this.accessService.canAccessCourse(user, asset.course);
      if (!decision.allowed) {
        throw new Error("Forbidden: You do not have access to this course's files");
      }
    }

    const url = await this.storage.getPresignedDownloadUrl({
      bucketType: "protected",
      key: asset.storageKey,
      expiresInSeconds: 3600,
      downloadFilename: asset.originalName,
    });

    return { url, isDirectPublic: false };
  }

  async deleteFileAsset(
    fileAssetId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileAssetId },
    });

    if (!asset) {
      throw new Error("File asset not found");
    }

    const canDelete =
      user.role === "ADMIN" ||
      (asset.uploadedById === user.id && hasPermission(user.role, "media:upload"));

    if (!canDelete) {
      throw new Error("Forbidden: You do not have permission to delete this file");
    }

    const bucketType = asset.visibility === "PUBLIC" ? "public" : "protected";

    // Delete from storage
    try {
      await this.storage.deleteObject(bucketType, asset.storageKey);
    } catch {
      // Storage deletion error should not block DB cleanup if key already removed
    }

    await this.prisma.fileAsset.delete({
      where: { id: fileAssetId },
    });
  }

  async listFileAssets(
    user: AuthenticatedUser,
    filters?: { search?: string; category?: string }
  ): Promise<Array<FileAssetDto & { publicUrl?: string }>> {
    const canList = user.role === "ADMIN" || hasPermission(user.role, "media:upload");
    if (!canList) {
      throw new Error("Forbidden: You do not have permission to list media assets");
    }

    const assets = await this.prisma.fileAsset.findMany({
      where: {
        ...(user.role === "ADMIN" ? {} : { uploadedById: user.id }),
        ...(filters?.category ? { category: filters.category as FileAssetDto["category"] } : {}),
        ...(filters?.search
          ? {
              originalName: {
                contains: filters.search,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return assets.map((asset) => ({
      ...asset,
      publicUrl:
        asset.visibility === "PUBLIC" ? this.storage.getPublicUrl(asset.storageKey) : undefined,
    }));
  }
}
export const fileService = new FileService();
