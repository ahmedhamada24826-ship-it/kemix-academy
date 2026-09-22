import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizService } from "./quiz.service";
import { CourseAccessService } from "../courses/course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("QuizService", () => {
  let mockPrisma: {
    course: { findUnique: ReturnType<typeof vi.fn> };
    quiz: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    quizQuestion: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    quizAttempt: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    quizAnswer: {
      upsert: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockAccessService: {
    canManageCourse: ReturnType<typeof vi.fn>;
    canAccessCourse: ReturnType<typeof vi.fn>;
  };
  let quizService: QuizService;

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
      quiz: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      quizQuestion: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      quizAttempt: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      quizAnswer: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
    };

    mockAccessService = {
      canManageCourse: vi.fn((user, course) => course.instructorId === user.id),
      canAccessCourse: vi.fn(async () => ({ allowed: true, isEnrolled: true })),
    };

    quizService = new QuizService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("createQuiz", () => {
    it("creates a quiz when user owns course", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: "inst-1",
      });
      mockPrisma.quiz.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "quiz-1", ...data })
      );

      const quiz = await quizService.createQuiz(instructorUser, {
        courseId: "course-1",
        title: "Pandas Mastery Quiz",
        passingScore: 80,
      });

      expect(quiz.id).toBe("quiz-1");
      expect(quiz.passingScore).toBe(80);
    });
  });

  describe("startAttempt & submitAttempt", () => {
    it("starts a quiz attempt for enrolled student", async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: "quiz-1",
        isPublished: true,
        maxAttempts: 2,
        course: { id: "course-1", instructorId: "inst-1" },
      });
      mockPrisma.quizAttempt.count.mockResolvedValue(0);
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);
      mockPrisma.quizAttempt.create.mockResolvedValue({
        id: "att-1",
        quizId: "quiz-1",
        userId: studentUser.id,
        status: "IN_PROGRESS",
      });

      const attempt = await quizService.startAttempt("quiz-1", studentUser);
      expect(attempt.id).toBe("att-1");
      expect(attempt.status).toBe("IN_PROGRESS");
    });

    it("calculates server-side score accurately on submission", async () => {
      const mockQuestions = [
        {
          id: "q-1",
          points: 10,
          options: [
            { id: "opt-1", isCorrect: true },
            { id: "opt-2", isCorrect: false },
          ],
        },
        {
          id: "q-2",
          points: 10,
          options: [
            { id: "opt-3", isCorrect: true },
            { id: "opt-4", isCorrect: false },
          ],
        },
      ];

      mockPrisma.quizAttempt.findUnique
        .mockResolvedValueOnce({
          id: "att-1",
          quizId: "quiz-1",
          userId: studentUser.id,
          status: "IN_PROGRESS",
          startedAt: new Date(Date.now() - 60000),
          expiresAt: new Date(Date.now() + 600000),
          quiz: {
            id: "quiz-1",
            passingScore: 70,
            questions: mockQuestions,
          },
        })
        .mockResolvedValueOnce({
          id: "att-1",
          quizId: "quiz-1",
          userId: studentUser.id,
          status: "SUBMITTED",
          score: 100,
          passed: true,
          answers: [
            { questionId: "q-1", selectedOptionId: "opt-1", isCorrect: true, pointsAwarded: 10 },
            { questionId: "q-2", selectedOptionId: "opt-3", isCorrect: true, pointsAwarded: 10 },
          ],
        });

      mockPrisma.quizAttempt.update.mockResolvedValue({
        id: "att-1",
        status: "SUBMITTED",
        score: 100,
        passed: true,
      });

      const result = await quizService.submitAttempt("att-1", studentUser, {
        answers: [
          { questionId: "q-1", selectedOptionId: "opt-1" },
          { questionId: "q-2", selectedOptionId: "opt-3" },
        ],
      });

      expect(result.status).toBe("SUBMITTED");
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });
  });
});
