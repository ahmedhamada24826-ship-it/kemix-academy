import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileService } from "./file.service";
import { CourseAccessService } from "../courses/course-access.service";
import { IStorageService } from "@/server/domain/storage/storage-service.interface";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("FileService", () => {
  let mockPrisma: {
    course: { findUnique: ReturnType<typeof vi.fn> };
    fileAsset: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
  let mockStorage: {
    getPresignedUploadUrl: ReturnType<typeof vi.fn>;
    getPresignedDownloadUrl: ReturnType<typeof vi.fn>;
    getPublicUrl: ReturnType<typeof vi.fn>;
    deleteObject: ReturnType<typeof vi.fn>;
    checkObjectExists: ReturnType<typeof vi.fn>;
  };
  let mockAccessService: {
    canManageCourse: ReturnType<typeof vi.fn>;
    canAccessCourse: ReturnType<typeof vi.fn>;
    canAccessLesson: ReturnType<typeof vi.fn>;
  };
  let fileService: FileService;

  const instructorUser: AuthenticatedUser = {
    id: "inst-1",
    email: "inst@kemix.com",
    fullName: "Instructor 1",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const studentUser: AuthenticatedUser = {
    id: "student-1",
    email: "student@kemix.com",
    fullName: "Student 1",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      fileAsset: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockStorage = {
      getPresignedUploadUrl: vi.fn().mockResolvedValue({
        uploadUrl: "https://storage.kemix.internal/upload?sig=abc",
        storageKey: "uploads/inst-1/file.pdf",
        bucket: "kemix-protected",
        expiresInSeconds: 900,
      }),
      getPresignedDownloadUrl: vi.fn().mockResolvedValue("https://storage.kemix.internal/download?sig=xyz"),
      getPublicUrl: vi.fn((key: string) => `https://cdn.kemix.internal/${key}`),
      deleteObject: vi.fn().mockResolvedValue(undefined),
      checkObjectExists: vi.fn().mockResolvedValue(true),
    };

    mockAccessService = {
      canManageCourse: vi.fn(() => true),
      canAccessCourse: vi.fn(async () => ({ allowed: true, isEnrolled: true })),
      canAccessLesson: vi.fn(async () => ({ allowed: true, isEnrolled: true })),
    };

    fileService = new FileService(
      mockPrisma as unknown as PrismaClient,
      mockStorage as unknown as IStorageService,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("requestUploadIntent", () => {
    it("generates presigned upload URL for authorized instructor", async () => {
      const ticket = await fileService.requestUploadIntent(instructorUser, {
        filename: "dataset.csv",
        mimeType: "text/csv",
        size: 1024 * 1024,
        category: "DOCUMENT",
        visibility: "PROTECTED",
      });

      expect(ticket.uploadUrl).toBeDefined();
      expect(mockStorage.getPresignedUploadUrl).toHaveBeenCalled();
    });

    it("rejects upload intent request from unauthorized student", async () => {
      await expect(
        fileService.requestUploadIntent(studentUser, {
          filename: "malicious.exe",
          mimeType: "application/octet-stream",
          size: 1024,
          category: "OTHER",
        })
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("getSignedAccessUrl", () => {
    it("returns signed presigned download URL for protected file", async () => {
      mockPrisma.fileAsset.findUnique.mockResolvedValue({
        id: "file-1",
        storageKey: "uploads/inst-1/dataset.csv",
        originalName: "dataset.csv",
        visibility: "PROTECTED",
        uploadedById: instructorUser.id,
      });

      const result = await fileService.getSignedAccessUrl("file-1", instructorUser);
      expect(result.isDirectPublic).toBe(false);
      expect(result.url).toBe("https://storage.kemix.internal/download?sig=xyz");
    });

    it("returns direct public URL for public asset", async () => {
      mockPrisma.fileAsset.findUnique.mockResolvedValue({
        id: "file-public-1",
        storageKey: "covers/cover.png",
        originalName: "cover.png",
        visibility: "PUBLIC",
        uploadedById: instructorUser.id,
      });

      const result = await fileService.getSignedAccessUrl("file-public-1", null);
      expect(result.isDirectPublic).toBe(true);
      expect(result.url).toBe("https://cdn.kemix.internal/covers/cover.png");
    });
  });
});
