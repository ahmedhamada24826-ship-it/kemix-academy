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
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    quizOption: {
      deleteMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
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
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      quizOption: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
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
      $transaction: vi.fn((operation: Promise<unknown>[] | ((tx: unknown) => Promise<unknown>)) =>
        typeof operation === "function"
          ? operation({
              quizQuestion: mockPrisma.quizQuestion,
              quizOption: mockPrisma.quizOption,
            })
          : Promise.all(operation)
      ),
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

    it("publishes a new quiz by default so it appears to students", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: "inst-1",
      });
      mockPrisma.quiz.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "quiz-2", ...data })
      );

      const quiz = await quizService.createQuiz(instructorUser, {
        courseId: "course-1",
        title: "Data Analysis Foundations Exam",
        passingScore: 70,
      });

      expect(quiz.isPublished).toBe(true);
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

  describe("listAllAttempts", () => {
    it("includes student and course metadata needed by the quizzes dashboard", async () => {
      mockPrisma.quizAttempt.findMany.mockResolvedValue([
        {
          id: "att-1",
          quizId: "quiz-1",
          userId: studentUser.id,
          score: 90,
          passed: true,
          attemptNumber: 1,
          timeSpentSeconds: 300,
          startedAt: new Date(),
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "SUBMITTED",
          user: { id: studentUser.id, fullName: studentUser.fullName, email: studentUser.email },
          quiz: { id: "quiz-1", title: "Midterm Quiz", passingScore: 75, timeLimitMinutes: 20, course: { id: "course-1", title: "Data Analysis" } },
        },
      ]);

      const attempts = await quizService.listAllAttempts(instructorUser, { quizId: "quiz-1" });

      expect(attempts).toHaveLength(1);
      expect(mockPrisma.quizAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quizId: "quiz-1",
            quiz: { course: { instructorId: instructorUser.id } },
          }),
          include: expect.objectContaining({
            user: { select: { id: true, fullName: true, email: true } },
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                timeLimitMinutes: true,
                course: { select: { id: true, title: true } },
              },
            },
          }),
        })
      );
      expect(attempts[0].user?.fullName).toBe(studentUser.fullName);
      expect(attempts[0].quiz?.course?.title).toBe("Data Analysis");
    });
  });

  describe("question management", () => {
    it("updates question text and replaces options", async () => {
      mockPrisma.quizQuestion.findUnique
        .mockResolvedValueOnce({
          id: "q-1",
          quiz: { course: { id: "course-1", instructorId: instructorUser.id } },
        })
        .mockResolvedValueOnce({
          id: "q-1",
          quizId: "quiz-1",
          prompt: "Updated?",
          points: 2,
          options: [{ id: "opt-1", text: "Yes", isCorrect: true }],
        });
      mockPrisma.quizQuestion.update.mockResolvedValue({});

      const updated = await quizService.updateQuestion("q-1", instructorUser, {
        prompt: "Updated?",
        points: 2,
        options: [{ text: "Yes", isCorrect: true }],
      });

      expect(updated.prompt).toBe("Updated?");
      expect(mockPrisma.quizOption.deleteMany).toHaveBeenCalledWith({ where: { questionId: "q-1" } });
      expect(mockPrisma.quizOption.createMany).toHaveBeenCalled();
    });

    it("deletes a question for an authorized course manager", async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue({
        id: "q-1",
        quiz: { course: { id: "course-1", instructorId: instructorUser.id } },
      });

      await quizService.deleteQuestion("q-1", instructorUser);

      expect(mockPrisma.quizQuestion.delete).toHaveBeenCalledWith({ where: { id: "q-1" } });
    });
  });
});
