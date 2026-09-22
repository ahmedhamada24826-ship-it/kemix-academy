import { describe, it, expect, vi, beforeEach } from "vitest";
import { CourseAccessService } from "./course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("CourseAccessService", () => {
  let mockPrisma: {
    enrollment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let accessService: CourseAccessService;

  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@kemix.com",
    fullName: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const instructorUser: AuthenticatedUser = {
    id: "instructor-1",
    email: "instructor@kemix.com",
    fullName: "Instructor One",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const otherInstructor: AuthenticatedUser = {
    id: "instructor-2",
    email: "other@kemix.com",
    fullName: "Other Instructor",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const studentUser: AuthenticatedUser = {
    id: "student-1",
    email: "student@kemix.com",
    fullName: "Student One",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const publishedCourse = {
    id: "course-pub-1",
    status: "PUBLISHED" as const,
    instructorId: "instructor-1",
  };

  const draftCourse = {
    id: "course-draft-1",
    status: "DRAFT" as const,
    instructorId: "instructor-1",
  };

  beforeEach(() => {
    mockPrisma = {
      enrollment: {
        findUnique: vi.fn(),
      },
    };
    accessService = new CourseAccessService(mockPrisma as unknown as PrismaClient);
  });

  describe("canManageCourse", () => {
    it("allows ADMIN to manage any course", () => {
      expect(accessService.canManageCourse(adminUser, publishedCourse)).toBe(true);
      expect(accessService.canManageCourse(adminUser, draftCourse)).toBe(true);
    });

    it("allows course owner INSTRUCTOR to manage own course", () => {
      expect(accessService.canManageCourse(instructorUser, publishedCourse)).toBe(true);
      expect(accessService.canManageCourse(instructorUser, draftCourse)).toBe(true);
    });

    it("denies another INSTRUCTOR from managing non-owned course", () => {
      expect(accessService.canManageCourse(otherInstructor, publishedCourse)).toBe(false);
    });

    it("denies STUDENT from managing any course", () => {
      expect(accessService.canManageCourse(studentUser, publishedCourse)).toBe(false);
    });
  });

  describe("canAccessCourse", () => {
    it("allows ADMIN full access even if draft", async () => {
      const decision = await accessService.canAccessCourse(adminUser, draftCourse);
      expect(decision.allowed).toBe(true);
      expect(decision.isOwnerOrAdmin).toBe(true);
    });

    it("allows owner instructor access to draft course", async () => {
      const decision = await accessService.canAccessCourse(instructorUser, draftCourse);
      expect(decision.allowed).toBe(true);
      expect(decision.isOwnerOrAdmin).toBe(true);
    });

    it("rejects non-owner student on draft course", async () => {
      const decision = await accessService.canAccessCourse(studentUser, draftCourse);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not published");
    });

    it("allows enrolled student on published course", async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enrollment-1",
        userId: "student-1",
        courseId: "course-pub-1",
        status: "ACTIVE",
      });

      const decision = await accessService.canAccessCourse(studentUser, publishedCourse);
      expect(decision.allowed).toBe(true);
      expect(decision.isEnrolled).toBe(true);
    });

    it("denies unenrolled student on published course", async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      const decision = await accessService.canAccessCourse(studentUser, publishedCourse);
      expect(decision.allowed).toBe(false);
      expect(decision.isEnrolled).toBe(false);
      expect(decision.reason).toContain("Enrollment required");
    });
  });

  describe("canAccessLesson", () => {
    const lessonBase = {
      id: "lesson-1",
      isPublished: true,
      isFreePreview: false,
      section: {
        courseId: "course-pub-1",
        course: publishedCourse,
      },
    };

    it("allows access if lesson is a free preview even if unenrolled", async () => {
      const previewLesson = { ...lessonBase, isFreePreview: true };
      const decision = await accessService.canAccessLesson(null, previewLesson);
      expect(decision.allowed).toBe(true);
    });

    it("denies access to unpublished lesson for regular students", async () => {
      const unpublishedLesson = { ...lessonBase, isPublished: false };
      const decision = await accessService.canAccessLesson(studentUser, unpublishedLesson);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not published");
    });

    it("allows enrolled student to access published lesson", async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enrollment-1",
        status: "ACTIVE",
      });

      const decision = await accessService.canAccessLesson(studentUser, lessonBase);
      expect(decision.allowed).toBe(true);
      expect(decision.isEnrolled).toBe(true);
    });
  });
});
