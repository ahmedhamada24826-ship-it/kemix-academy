import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { CourseStatus } from "@/types";

export interface CourseAccessDecision {
  allowed: boolean;
  reason?: string;
  isEnrolled?: boolean;
  isOwnerOrAdmin?: boolean;
}

export class CourseAccessService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  /**
   * Checks whether a user has administrative/authoring management permissions on a course.
   */
  canManageCourse(
    user: AuthenticatedUser,
    course: {
      id: string;
      instructorId: string;
      coInstructors?: { instructorId: string }[];
    }
  ): boolean {
    if (user.role === "ADMIN") return true;
    if (
      user.role === "INSTRUCTOR" &&
      (course.instructorId === user.id ||
        course.coInstructors?.some((coInstructor) => coInstructor.instructorId === user.id))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Evaluates if a user can access a course and its full content.
   */
  async canAccessCourse(
    user: AuthenticatedUser | null,
    course: {
      id: string;
      status: CourseStatus;
      instructorId: string;
      coInstructors?: { instructorId: string }[];
    }
  ): Promise<CourseAccessDecision> {
    if (user && this.canManageCourse(user, course)) {
      return { allowed: true, isEnrolled: true, isOwnerOrAdmin: true };
    }

    if (course.status !== "PUBLISHED") {
      return {
        allowed: false,
        reason: "Course is not published",
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    if (!user) {
      return {
        allowed: false,
        reason: "Authentication required",
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED")) {
      return {
        allowed: true,
        isEnrolled: true,
        isOwnerOrAdmin: false,
      };
    }

    return {
      allowed: false,
      reason: "Enrollment required",
      isEnrolled: false,
      isOwnerOrAdmin: false,
    };
  }

  /**
   * Evaluates if a user can access a specific lesson.
   * Supports free previews for unenrolled/guest users on published courses.
   */
  async canAccessLesson(
    user: AuthenticatedUser | null,
    lesson: {
      id: string;
      isPublished: boolean;
      isFreePreview: boolean;
      section: {
        courseId: string;
        course: {
          id: string;
          status: CourseStatus;
          instructorId: string;
          coInstructors?: { instructorId: string }[];
        };
      };
    }
  ): Promise<CourseAccessDecision> {
    const { course } = lesson.section;

    if (user && this.canManageCourse(user, course)) {
      return { allowed: true, isEnrolled: true, isOwnerOrAdmin: true };
    }

    if (!lesson.isPublished) {
      return {
        allowed: false,
        reason: "Lesson is not published",
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    if (course.status !== "PUBLISHED") {
      return {
        allowed: false,
        reason: "Course is not published",
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    if (lesson.isFreePreview) {
      return {
        allowed: true,
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    if (!user) {
      return {
        allowed: false,
        reason: "Authentication required to access lesson",
        isEnrolled: false,
        isOwnerOrAdmin: false,
      };
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED")) {
      return {
        allowed: true,
        isEnrolled: true,
        isOwnerOrAdmin: false,
      };
    }

    return {
      allowed: false,
      reason: "Enrollment required to access this lesson",
      isEnrolled: false,
      isOwnerOrAdmin: false,
    };
  }
}

export const courseAccessService = new CourseAccessService();
