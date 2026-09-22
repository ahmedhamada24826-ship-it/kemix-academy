import { describe, it, expect, vi, beforeEach } from "vitest";
import { LessonService } from "./lesson.service";
import { CourseAccessService } from "../courses/course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("LessonService", () => {
  let mockPrisma: {
    courseSection: { findUnique: ReturnType<typeof vi.fn> };
    lesson: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockAccessService: {
    canManageCourse: ReturnType<typeof vi.fn>;
    canAccessLesson: ReturnType<typeof vi.fn>;
  };
  let lessonService: LessonService;

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
      courseSection: {
        findUnique: vi.fn(),
      },
      lesson: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
    };

    mockAccessService = {
      canManageCourse: vi.fn((user, course) => course.instructorId === user.id),
      canAccessLesson: vi.fn(async (user, lesson) => {
        if (lesson.isFreePreview) return { allowed: true };
        if (user && user.role === "STUDENT") return { allowed: true };
        return { allowed: false, reason: "Enrollment required" };
      }),
    };

    lessonService = new LessonService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("createLesson", () => {
    it("creates lesson with generated slug and valid section", async () => {
      mockPrisma.courseSection.findUnique.mockResolvedValue({
        id: "sec-1",
        course: { id: "course-1", instructorId: "inst-1" },
      });
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      mockPrisma.lesson.findFirst.mockResolvedValue({ sortOrder: 1 });
      mockPrisma.lesson.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "lesson-1", ...data })
      );

      const result = await lessonService.createLesson("sec-1", instructorUser, {
        title: "Introduction to Pandas DataFrames",
        lessonType: "VIDEO",
        isPublished: true,
      });

      expect(result.id).toBe("lesson-1");
      expect(result.slug).toBe("introduction-to-pandas-dataframes");
      expect(result.sortOrder).toBe(2);
    });

    it.each([
      ["English lesson title", "english-lesson-title"],
      ["درس باللغة العربية", "درس-باللغة-العربية"],
    ])("creates a lesson slug for %s", async (title, expectedSlug) => {
      mockPrisma.courseSection.findUnique.mockResolvedValue({
        id: "sec-1",
        course: { id: "course-1", instructorId: "inst-1" },
      });
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);
      mockPrisma.lesson.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "lesson-1", ...data })
      );

      const result = await lessonService.createLesson("sec-1", instructorUser, {
        title,
      });

      expect(result.slug).toBe(expectedSlug);
    });
  });

  describe("getLessonById", () => {
    it("allows student to access lesson when authorized", async () => {
      const lessonData = {
        id: "lesson-1",
        title: "Pandas Basics",
        isPublished: true,
        isFreePreview: false,
        section: {
          include: {},
          course: { id: "course-1", status: "PUBLISHED", instructorId: "inst-1" },
        },
        files: [],
        quizzes: [],
      };
      mockPrisma.lesson.findUnique.mockResolvedValue(lessonData);

      const result = await lessonService.getLessonById("lesson-1", studentUser);
      expect(result.title).toBe("Pandas Basics");
    });
  });
});
