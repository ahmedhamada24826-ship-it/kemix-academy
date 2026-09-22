import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  EnrollmentDto,
  AdminAssignEnrollmentInput,
  EnrollmentFilterParams,
} from "@/server/domain/enrollments/enrollment.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IEnrollmentService } from "./enrollment.service.interface";

export class EnrollmentService implements IEnrollmentService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async selfEnroll(userId: string, courseId: string): Promise<EnrollmentDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.status !== "PUBLISHED") {
      throw new Error("Cannot enroll in an unpublished course");
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE" || existing.status === "COMPLETED") {
        return existing;
      }
      // If previously cancelled, reactivate
      const reactivated = await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          enrolledAt: new Date(),
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            },
          },
        },
      });
      return reactivated;
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
        enrollmentType: "FREE_ENROLLMENT",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
      },
    });

    return enrollment;
  }

  async adminAssign(
    assignedBy: AuthenticatedUser,
    input: AdminAssignEnrollmentInput
  ): Promise<EnrollmentDto> {
    if (assignedBy.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can assign enrollments");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          enrollmentType: input.enrollmentType ?? "ADMIN_ASSIGNED",
          enrolledAt: new Date(),
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
      return updated;
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        status: "ACTIVE",
        enrollmentType: input.enrollmentType ?? "ADMIN_ASSIGNED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return enrollment;
  }

  async getEnrollment(
    userId: string,
    courseId: string
  ): Promise<EnrollmentDto | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
      },
    });

    return enrollment;
  }

  async listUserEnrollments(
    userId: string,
    params?: EnrollmentFilterParams
  ): Promise<{ enrollments: EnrollmentDto[]; total: number }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.courseId ? { courseId: params.courseId } : {}),
    };

    const [total, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            },
          },
        },
      }),
    ]);

    return { enrollments, total };
  }

  async listAllEnrollments(
    user: AuthenticatedUser,
    params?: EnrollmentFilterParams
  ): Promise<{ enrollments: EnrollmentDto[]; total: number }> {
    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      throw new Error("Forbidden: Insufficient permissions to list platform enrollments");
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      ...(params?.userId ? { userId: params.userId } : {}),
      ...(params?.courseId ? { courseId: params.courseId } : {}),
      ...(params?.status ? { status: params.status } : {}),
    };

    // If instructor, only allow filtering for their courses
    if (user.role === "INSTRUCTOR") {
      where.course = {
        instructorId: user.id,
      };
    }

    const [total, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return { enrollments, total };
  }

  async cancelEnrollment(
    userId: string,
    courseId: string,
    performedBy: AuthenticatedUser
  ): Promise<void> {
    const isSelf = performedBy.id === userId;
    const isAdmin = performedBy.role === "ADMIN";

    if (!isSelf && !isAdmin) {
      throw new Error("Forbidden: You cannot cancel another user's enrollment");
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!existing) {
      throw new Error("Enrollment not found");
    }

    await this.prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });
  }
}

export const enrollmentService = new EnrollmentService();
