import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressService } from "./progress.service";
import { CourseAccessService } from "../courses/course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("ProgressService", () => {
  let mockPrisma: {
    lesson: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    enrollment: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    lessonProgress: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    course: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let mockAccessService: { canManageCourse: ReturnType<typeof vi.fn> };
  let progressService: ProgressService;

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
      lesson: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      lessonProgress: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
      },
    };

    mockAccessService = {
      canManageCourse: vi.fn(),
    };

    progressService = new ProgressService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("updateLessonProgress", () => {
    it("updates lesson progress when user is enrolled", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        section: { courseId: "course-1" },
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enr-1",
        status: "ACTIVE",
      });
      mockPrisma.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrisma.lessonProgress.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "prog-1", ...data })
      );
      mockPrisma.lesson.findMany.mockResolvedValue([{ id: "lesson-1" }]);
      mockPrisma.lessonProgress.count.mockResolvedValue(1);

      const result = await progressService.updateLessonProgress(
        studentUser.id,
        "lesson-1",
        { progressPercent: 100, completed: true }
      );

      expect(result.completed).toBe(true);
      expect(result.progressPercent).toBe(100);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it("rejects progress update if user is not enrolled", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        section: { courseId: "course-1" },
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        progressService.updateLessonProgress(studentUser.id, "lesson-1", {
          progressPercent: 50,
        })
      ).rejects.toThrow("Forbidden: You must be enrolled");
    });
  });

  describe("calculateCourseCompletion", () => {
    it("calculates 100% completion when all published lessons are completed", async () => {
      mockPrisma.lesson.findMany.mockResolvedValue([
        { id: "lesson-1" },
        { id: "lesson-2" },
      ]);
      mockPrisma.lessonProgress.count.mockResolvedValue(2);

      const completion = await progressService.calculateCourseCompletion(
        studentUser.id,
        "course-1"
      );

      expect(completion.totalLessons).toBe(2);
      expect(completion.completedLessons).toBe(2);
      expect(completion.percentage).toBe(100);
      expect(completion.isCompleted).toBe(true);
    });
  });
});
