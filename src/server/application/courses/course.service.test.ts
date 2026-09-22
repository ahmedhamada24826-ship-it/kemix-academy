import { describe, it, expect, vi, beforeEach } from "vitest";
import { CourseService } from "./course.service";
import { CourseAccessService } from "./course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("CourseService", () => {
  let mockPrisma: {
    course: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    enrollment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let mockAccessService: { canManageCourse: ReturnType<typeof vi.fn> };
  let courseService: CourseService;

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

  const otherInstructor: AuthenticatedUser = {
    id: "inst-2",
    email: "inst2@kemix.com",
    fullName: "Instructor 2",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
    };

    mockAccessService = {
      canManageCourse: vi.fn((user, course) => {
        if (user.role === "ADMIN") return true;
        if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return true;
        return false;
      }),
    };

    courseService = new CourseService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("createCourse", () => {
    it("creates a draft course with generated slug", async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      mockPrisma.course.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "course-1",
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const result = await courseService.createCourse(instructorUser.id, {
        title: "Introduction to SQL",
        description: "Learn relational database analysis from scratch.",
        level: "BEGINNER",
      });

      expect(result.id).toBe("course-1");
      expect(result.slug).toBe("introduction-to-sql");
      expect(result.status).toBe("DRAFT");
      expect(result.instructorId).toBe(instructorUser.id);
    });
  });

  describe("updateCourse", () => {
    it("updates course successfully when owned by instructor", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: instructorUser.id,
        title: "Old Title",
        status: "DRAFT",
      });

      mockPrisma.course.update.mockResolvedValue({
        id: "course-1",
        title: "Updated Title",
        instructorId: instructorUser.id,
        status: "DRAFT",
      });

      const result = await courseService.updateCourse("course-1", instructorUser, {
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");
      expect(mockPrisma.course.update).toHaveBeenCalled();
    });

    it("throws forbidden if another instructor tries to update", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: instructorUser.id,
        title: "Old Title",
        status: "DRAFT",
      });

      await expect(
        courseService.updateCourse("course-1", otherInstructor, {
          title: "Hijacked Title",
        })
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("publishCourse", () => {
    it("allows course instructor to publish", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: instructorUser.id,
        status: "DRAFT",
      });

      mockPrisma.course.update.mockResolvedValue({
        id: "course-1",
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      const result = await courseService.publishCourse("course-1", instructorUser, true);
      expect(result.status).toBe("PUBLISHED");
    });
  });
});
