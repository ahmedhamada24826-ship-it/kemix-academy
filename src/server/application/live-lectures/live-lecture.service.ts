import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import {
  LiveLectureDto,
  CreateLiveLectureInput,
  UpdateLiveLectureInput,
} from "@/server/domain/live-lectures/live-lecture.types";
import { LiveLectureStatus } from "@/types";

type LiveLectureWithRelations = Prisma.LiveLectureGetPayload<{
  include: {
    course: { select: { id: true; title: true; slug: true; status: true } };
    instructor: { select: { id: true; fullName: true; email: true } };
  };
}>;

export class LiveLectureService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  private mapLecture(lecture: LiveLectureWithRelations): LiveLectureDto {
    return {
      id: lecture.id,
      title: lecture.title,
      courseId: lecture.courseId,
      instructorId: lecture.instructorId,
      scheduledAt: lecture.scheduledAt?.toISOString?.() ?? String(lecture.scheduledAt),
      durationMinutes: lecture.durationMinutes ?? 60,
      description: lecture.description ?? null,
      status: lecture.status,
      youtubeBroadcastId: lecture.youtubeBroadcastId ?? null,
      youtubeVideoId: lecture.youtubeVideoId ?? null,
      youtubeUrl: lecture.youtubeUrl ?? null,
      youtubeEmbedUrl: lecture.youtubeEmbedUrl ?? null,
      thumbnailUrl: lecture.thumbnailUrl ?? null,
      recordingStatus: lecture.recordingStatus ?? null,
      recordedAt: lecture.recordedAt ? new Date(lecture.recordedAt).toISOString() : null,
      startedAt: lecture.startedAt ? new Date(lecture.startedAt).toISOString() : null,
      endedAt: lecture.endedAt ? new Date(lecture.endedAt).toISOString() : null,
      createdAt: new Date(lecture.createdAt).toISOString(),
      updatedAt: new Date(lecture.updatedAt).toISOString(),
      course: lecture.course
        ? {
            id: lecture.course.id,
            title: lecture.course.title,
            slug: lecture.course.slug,
            status: lecture.course.status,
          }
        : undefined,
      instructor: lecture.instructor
        ? {
            id: lecture.instructor.id,
            fullName: lecture.instructor.fullName,
            email: lecture.instructor.email,
          }
        : undefined,
    };
  }

  async listLecturesForUser(user: AuthenticatedUser, courseId?: string): Promise<LiveLectureDto[]> {
    const where: Prisma.LiveLectureWhereInput = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (user.role === "ADMIN") {
      // admin can access all lectures
    } else if (user.role === "INSTRUCTOR") {
      where.instructorId = user.id;
    } else if (user.role === "STUDENT") {
      if (!courseId) {
        return [];
      }

      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      });

      if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
        return [];
      }
    } else {
      return [];
    }

    const lectures = await this.prisma.liveLecture.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return lectures.map((lecture) => this.mapLecture(lecture));
  }

  async getLectureById(lectureId: string, user: AuthenticatedUser | null): Promise<LiveLectureDto | null> {
    if (!user) return null;

    const lecture = await this.prisma.liveLecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            instructorId: true,
            coInstructors: { select: { instructorId: true } },
          },
        },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!lecture) return null;

    if (user.role === "ADMIN") {
      return this.mapLecture(lecture);
    }

    if (lecture.instructorId === user.id) {
      return this.mapLecture(lecture);
    }

    if (user.role === "INSTRUCTOR") {
      const canManageCourse =
        lecture.course.instructorId === user.id ||
        lecture.course.coInstructors.some((coInstructor: { instructorId: string }) => coInstructor.instructorId === user.id);
      if (canManageCourse) {
        return this.mapLecture(lecture);
      }
    }

    if (user.role === "STUDENT") {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: lecture.courseId,
          },
        },
      });
      if (enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED")) {
        return this.mapLecture(lecture);
      }
    }

    return null;
  }

  async createLecture(
    user: AuthenticatedUser,
    input: CreateLiveLectureInput
  ): Promise<LiveLectureDto> {
    if (user.role !== "ADMIN") {
      throw new Error("Only admins can schedule live lectures");
    }

    const lecture = await this.prisma.liveLecture.create({
      data: {
        title: input.title,
        courseId: input.courseId,
        instructorId: input.instructorId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes ?? 60,
        description: input.description ?? null,
        status: input.status ?? "SCHEDULED",
      },
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapLecture(lecture);
  }

  async updateLecture(lectureId: string, user: AuthenticatedUser, input: UpdateLiveLectureInput) {
    const current = await this.getLectureById(lectureId, user);
    if (!current) {
      throw new Error("Live lecture not found or access denied");
    }

    const updated = await this.prisma.liveLecture.update({
      where: { id: lectureId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.courseId !== undefined ? { courseId: input.courseId } : {}),
        ...(input.instructorId !== undefined ? { instructorId: input.instructorId } : {}),
        ...(input.scheduledAt !== undefined ? { scheduledAt: new Date(input.scheduledAt) } : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.youtubeBroadcastId !== undefined ? { youtubeBroadcastId: input.youtubeBroadcastId } : {}),
        ...(input.youtubeVideoId !== undefined ? { youtubeVideoId: input.youtubeVideoId } : {}),
        ...(input.youtubeUrl !== undefined ? { youtubeUrl: input.youtubeUrl } : {}),
        ...(input.youtubeEmbedUrl !== undefined ? { youtubeEmbedUrl: input.youtubeEmbedUrl } : {}),
        ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
        ...(input.recordingStatus !== undefined ? { recordingStatus: input.recordingStatus } : {}),
        ...(input.recordedAt !== undefined ? { recordedAt: input.recordedAt ? new Date(input.recordedAt) : null } : {}),
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt ? new Date(input.startedAt) : null } : {}),
        ...(input.endedAt !== undefined ? { endedAt: input.endedAt ? new Date(input.endedAt) : null } : {}),
      },
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapLecture(updated);
  }

  async startLecture(lectureId: string, user: AuthenticatedUser): Promise<LiveLectureDto> {
    const lecture = await this.getLectureById(lectureId, user);
    if (!lecture) {
      throw new Error("Live lecture not found or access denied");
    }

    if (lecture.status === "RECORDED" || lecture.status === "PROCESSING") {
      throw new Error("This lecture has already been processed and can no longer be started");
    }

    const updated = await this.prisma.liveLecture.update({
      where: { id: lectureId },
      data: {
        status: "LIVE" as LiveLectureStatus,
        startedAt: new Date(),
        endedAt: null,
      },
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapLecture(updated);
  }

  async endLecture(lectureId: string, user: AuthenticatedUser): Promise<LiveLectureDto> {
    const lecture = await this.getLectureById(lectureId, user);
    if (!lecture) {
      throw new Error("Live lecture not found or access denied");
    }

    if (lecture.status !== "LIVE") {
      throw new Error("Only active live lectures can be ended");
    }

    const updated = await this.prisma.liveLecture.update({
      where: { id: lectureId },
      data: {
        status: "PROCESSING" as LiveLectureStatus,
        endedAt: new Date(),
        recordingStatus: "PENDING",
      },
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
        instructor: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.mapLecture(updated);
  }
}

export const liveLectureService = new LiveLectureService();
