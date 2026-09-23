import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  QuizDto,
  QuizQuestionDto,
  QuizAttemptDto,
  CreateQuizInput,
  UpdateQuizInput,
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
  SubmitQuizAttemptInput,
  ManualOverrideInput,
} from "@/server/domain/quizzes/quiz.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IQuizService } from "./quiz.service.interface";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";
import { auditLogService } from "../audit/audit.service";

export class QuizService implements IQuizService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  async createQuiz(
    user: AuthenticatedUser,
    input: CreateQuizInput
  ): Promise<QuizDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You cannot create quizzes for this course");
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        courseId: input.courseId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        passingScore: input.passingScore ?? 70,
        timeLimitMinutes: input.timeLimitMinutes,
        maxAttempts: input.maxAttempts ?? 0,
        randomizeQuestions: input.randomizeQuestions ?? false,
        randomizeAnswers: input.randomizeAnswers ?? false,
        showResultImmediately: input.showResultImmediately ?? true,
        showCorrectAnswers: input.showCorrectAnswers ?? true,
        allowReview: input.allowReview ?? true,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isPublished: input.isPublished ?? false,
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "QUIZ_CREATED",
      entity: "Quiz",
      entityId: quiz.id,
      details: { title: quiz.title, courseId: quiz.courseId },
    });

    return quiz;
  }

  async updateQuiz(
    quizId: string,
    user: AuthenticatedUser,
    input: UpdateQuizInput
  ): Promise<QuizDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, instructorId: true } },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!this.accessService.canManageCourse(user, quiz.course)) {
      throw new Error("Forbidden: You cannot modify this quiz");
    }

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.lessonId !== undefined && { lessonId: input.lessonId }),
        ...(input.passingScore !== undefined && { passingScore: input.passingScore }),
        ...(input.timeLimitMinutes !== undefined && {
          timeLimitMinutes: input.timeLimitMinutes,
        }),
        ...(input.maxAttempts !== undefined && { maxAttempts: input.maxAttempts }),
        ...(input.randomizeQuestions !== undefined && {
          randomizeQuestions: input.randomizeQuestions,
        }),
        ...(input.randomizeAnswers !== undefined && {
          randomizeAnswers: input.randomizeAnswers,
        }),
        ...(input.showResultImmediately !== undefined && {
          showResultImmediately: input.showResultImmediately,
        }),
        ...(input.showCorrectAnswers !== undefined && {
          showCorrectAnswers: input.showCorrectAnswers,
        }),
        ...(input.allowReview !== undefined && {
          allowReview: input.allowReview,
        }),
        ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
        ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "QUIZ_UPDATED",
      entity: "Quiz",
      entityId: quizId,
      details: { title: updated.title },
    });

    return updated;
  }

  async deleteQuiz(quizId: string, user: AuthenticatedUser): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, instructorId: true } },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!this.accessService.canManageCourse(user, quiz.course)) {
      throw new Error("Forbidden: You cannot delete this quiz");
    }

    await this.prisma.quiz.delete({
      where: { id: quizId },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "QUIZ_DELETED",
      entity: "Quiz",
      entityId: quizId,
      details: { title: quiz.title },
    });
  }

  async addQuestion(
    quizId: string,
    user: AuthenticatedUser,
    input: CreateQuizQuestionInput
  ): Promise<QuizQuestionDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, instructorId: true } },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!this.accessService.canManageCourse(user, quiz.course)) {
      throw new Error("Forbidden: You cannot add questions to this quiz");
    }

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const highest = await this.prisma.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const question = await this.prisma.quizQuestion.create({
      data: {
        quizId,
        prompt: input.prompt,
        questionType: input.questionType ?? "SINGLE_CHOICE",
        sortOrder,
        points: input.points ?? 1,
        explanation: input.explanation,
        options: {
          create: input.options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder ?? idx,
          })),
        },
      },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return question;
  }

  async getQuizById(
    quizId: string,
    user?: AuthenticatedUser | null
  ): Promise<QuizDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, status: true, instructorId: true } },
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, quiz.course) : false;

    if (!quiz.isPublished && !canManage) {
      throw new Error("Quiz not found or unpublished");
    }

    // If student/guest, strip isCorrect and explanations
    const sanitizedQuestions = quiz.questions.map((q) => ({
      ...q,
      explanation: canManage ? q.explanation : undefined,
      options: q.options.map((opt) => ({
        id: opt.id,
        questionId: opt.questionId,
        text: opt.text,
        sortOrder: opt.sortOrder,
        isCorrect: canManage ? opt.isCorrect : undefined,
      })),
    }));

    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  async updateQuestion(
    questionId: string,
    user: AuthenticatedUser,
    input: UpdateQuizQuestionInput
  ): Promise<QuizQuestionDto> {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { course: { select: { id: true, instructorId: true } } } } },
    });

    if (!question) throw new Error("Quiz question not found");
    if (!this.accessService.canManageCourse(user, question.quiz.course)) {
      throw new Error("Forbidden: You cannot modify this quiz question");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          ...(input.prompt !== undefined && { prompt: input.prompt }),
          ...(input.questionType !== undefined && { questionType: input.questionType }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
          ...(input.points !== undefined && { points: input.points }),
          ...(input.explanation !== undefined && { explanation: input.explanation }),
        },
      });

      if (input.options) {
        await tx.quizOption.deleteMany({ where: { questionId } });
        await tx.quizOption.createMany({
          data: input.options.map((option, index) => ({
            questionId,
            text: option.text,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder ?? index,
          })),
        });
      }

      return tx.quizQuestion.findUnique({
        where: { id: questionId },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      });
    });

    if (!updated) throw new Error("Quiz question not found");
    return updated;
  }

  async deleteQuestion(questionId: string, user: AuthenticatedUser): Promise<void> {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { course: { select: { id: true, instructorId: true } } } } },
    });

    if (!question) throw new Error("Quiz question not found");
    if (!this.accessService.canManageCourse(user, question.quiz.course)) {
      throw new Error("Forbidden: You cannot delete this quiz question");
    }

    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  async listQuizzesByCourse(
    courseId: string,
    user: AuthenticatedUser
  ): Promise<QuizDto[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You cannot view course quizzes");
    }

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return quizzes;
  }

  async startAttempt(
    quizId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, status: true, instructorId: true } },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!quiz.isPublished || quiz.isArchived) {
      throw new Error("Quiz is not published or is archived");
    }

    const now = new Date();
    if (quiz.startsAt && now < quiz.startsAt) {
      throw new Error("Quiz is not open yet");
    }
    if (quiz.endsAt && now > quiz.endsAt) {
      throw new Error("Quiz is closed");
    }

    // Access check: User must be enrolled or instructor/admin
    const access = await this.accessService.canAccessCourse(user, quiz.course);
    if (!access.allowed) {
      throw new Error(access.reason || "You must be enrolled to take this quiz");
    }

    // Check attempt limits
    const pastAttemptsCount = await this.prisma.quizAttempt.count({
      where: {
        quizId,
        userId: user.id,
        status: { in: ["SUBMITTED", "EXPIRED"] },
      },
    });

    if (quiz.maxAttempts > 0 && pastAttemptsCount >= quiz.maxAttempts) {
      throw new Error(`Maximum attempts reached (${quiz.maxAttempts})`);
    }

    // Check if there is already an in-progress attempt
    const activeAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: user.id,
        status: "IN_PROGRESS",
      },
    });

    if (activeAttempt) {
      // Check if server-authoritative timer expired
      if (activeAttempt.expiresAt && new Date() > activeAttempt.expiresAt) {
        // Auto mark as expired
        const _expiredAttempt = await this.prisma.quizAttempt.update({
          where: { id: activeAttempt.id },
          data: {
            status: "EXPIRED",
            score: 0,
            passed: false,
            submittedAt: new Date(),
          },
        });
        // Check if attempts left to start a new one
        if (quiz.maxAttempts > 0 && pastAttemptsCount + 1 >= quiz.maxAttempts) {
          throw new Error(`Previous attempt expired and maximum attempts reached (${quiz.maxAttempts})`);
        }
      } else {
        return activeAttempt;
      }
    }

    let expiresAt: Date | null = null;
    if (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0) {
      expiresAt = new Date(now.getTime() + quiz.timeLimitMinutes * 60 * 1000);
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        status: "IN_PROGRESS",
        attemptNumber: pastAttemptsCount + 1,
        startedAt: now,
        expiresAt,
      },
    });

    return attempt;
  }

  async submitAttempt(
    attemptId: string,
    user: AuthenticatedUser,
    input: SubmitQuizAttemptInput
  ): Promise<QuizAttemptDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new Error("Quiz attempt not found");
    }

    if (attempt.userId !== user.id) {
      throw new Error("Forbidden: You cannot submit another user's attempt");
    }

    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("Attempt has already been submitted or completed");
    }

    const now = new Date();
    // Enforce server-side timer expiration (allowing 15s network latency buffer)
    const isOverdue =
      attempt.expiresAt && now.getTime() > attempt.expiresAt.getTime() + 15000;

    const { quiz } = attempt;
    const submittedAnswersMap = new Map<string, string>();
    for (const ans of input.answers) {
      submittedAnswersMap.set(ans.questionId, ans.selectedOptionId);
    }

    let totalPointsAwarded = 0;
    let totalPossiblePoints = 0;
    const answerRecords: {
      attemptId: string;
      questionId: string;
      selectedOptionId: string | null;
      isCorrect: boolean;
      pointsAwarded: number;
    }[] = [];

    for (const question of quiz.questions) {
      totalPossiblePoints += question.points;
      const selectedOptionId = submittedAnswersMap.get(question.id) || null;
      let isCorrect = false;
      let pointsAwarded = 0;

      if (selectedOptionId) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (correctOption && correctOption.id === selectedOptionId) {
          isCorrect = true;
          pointsAwarded = question.points;
          totalPointsAwarded += pointsAwarded;
        }
      }

      answerRecords.push({
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionId,
        isCorrect,
        pointsAwarded,
      });
    }

    const scorePercentage =
      totalPossiblePoints > 0
        ? Math.round((totalPointsAwarded / totalPossiblePoints) * 100)
        : 100;
    const passed = scorePercentage >= quiz.passingScore;
    const status = isOverdue ? "EXPIRED" : "SUBMITTED";
    const timeSpentSeconds = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);

    // Persist grading in transaction
    const [updatedAttempt] = await this.prisma.$transaction([
      this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          score: scorePercentage,
          passed,
          submittedAt: now,
          timeSpentSeconds,
        },
      }),
      ...answerRecords.map((ans) =>
        this.prisma.quizAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: ans.attemptId,
              questionId: ans.questionId,
            },
          },
          create: ans,
          update: {
            selectedOptionId: ans.selectedOptionId,
            isCorrect: ans.isCorrect,
            pointsAwarded: ans.pointsAwarded,
          },
        })
      ),
    ]);

    const fullAttempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
      },
    });

    return fullAttempt || updatedAttempt;
  }

  async getAttempt(
    attemptId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: { select: { id: true, instructorId: true } },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new Error("Quiz attempt not found");
    }

    const isOwner = attempt.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isInstructor =
      user.role === "INSTRUCTOR" && attempt.quiz.course.instructorId === user.id;

    if (!isOwner && !isAdmin && !isInstructor) {
      throw new Error("Forbidden: You cannot view this attempt");
    }

    return attempt;
  }

  async listUserAttempts(
    quizId: string,
    userId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto[]> {
    const isSelf = user.id === userId;
    const isAdmin = user.role === "ADMIN";

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, instructorId: true } },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const isInstructor =
      user.role === "INSTRUCTOR" && quiz.course.instructorId === user.id;

    if (!isSelf && !isAdmin && !isInstructor) {
      throw new Error("Forbidden: You cannot view attempts for this user");
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        userId,
      },
      orderBy: { startedAt: "desc" },
      include: {
        answers: true,
      },
    });

    return attempts;
  }

  async listAllAttempts(
    user: AuthenticatedUser,
    params?: { courseId?: string; quizId?: string; passed?: boolean }
  ): Promise<QuizAttemptDto[]> {
    if (user.role === "STUDENT") {
      throw new Error("Forbidden: Students cannot view all attempts");
    }

    const where: Record<string, unknown> = {};
    if (params?.quizId) {
      where.quizId = params.quizId;
    }
    if (params?.courseId) {
      where.quiz = { courseId: params.courseId };
    }
    if (params?.passed !== undefined) {
      where.passed = params.passed;
    }

    if (user.role === "INSTRUCTOR") {
      where.quiz = {
        ...(where.quiz || {}),
        course: { instructorId: user.id },
      };
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimitMinutes: true,
          },
        },
      },
    });

    return attempts;
  }

  async manualOverride(
    adminUser: AuthenticatedUser,
    input: ManualOverrideInput
  ): Promise<{ success: boolean; message: string }> {
    if (adminUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can execute manual overrides");
    }

    const student = await this.prisma.user.findUnique({
      where: { email: input.studentEmail },
      select: { id: true, email: true, fullName: true },
    });

    if (!student) {
      throw new Error(`Student with email ${input.studentEmail} not found`);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    switch (input.action) {
      case "UNLOCK_LESSON": {
        if (!input.lessonId) throw new Error("lessonId is required for UNLOCK_LESSON");
        await this.prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: student.id,
              lessonId: input.lessonId,
            },
          },
          create: {
            userId: student.id,
            lessonId: input.lessonId,
            courseId: input.courseId,
            isManuallyUnlocked: true,
            unlockedAt: new Date(),
          },
          update: {
            isManuallyUnlocked: true,
            unlockedAt: new Date(),
          },
        });
        break;
      }

      case "PASS_QUIZ": {
        if (!input.quizId) throw new Error("quizId is required for PASS_QUIZ");
        await this.prisma.quizAttempt.create({
          data: {
            quizId: input.quizId,
            userId: student.id,
            status: "SUBMITTED",
            score: 100,
            passed: true,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
        });
        break;
      }

      case "COMPLETE_LESSON": {
        if (!input.lessonId) throw new Error("lessonId is required for COMPLETE_LESSON");
        await this.prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: student.id,
              lessonId: input.lessonId,
            },
          },
          create: {
            userId: student.id,
            lessonId: input.lessonId,
            courseId: input.courseId,
            completed: true,
            progressPercent: 100,
            completedAt: new Date(),
            isManuallyUnlocked: true,
            unlockedAt: new Date(),
          },
          update: {
            completed: true,
            progressPercent: 100,
            completedAt: new Date(),
            isManuallyUnlocked: true,
          },
        });
        break;
      }

      case "RESET_ATTEMPTS": {
        if (!input.quizId) throw new Error("quizId is required for RESET_ATTEMPTS");
        await this.prisma.quizAttempt.deleteMany({
          where: {
            quizId: input.quizId,
            userId: student.id,
          },
        });
        break;
      }

      case "REVOKE_ACCESS": {
        await this.prisma.enrollment.updateMany({
          where: {
            userId: student.id,
            courseId: input.courseId,
          },
          data: {
            status: "CANCELLED",
          },
        });
        break;
      }
    }

    await auditLogService.recordLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorName: adminUser.fullName,
      action: `MANUAL_OVERRIDE_${input.action}`,
      entity: "ManualOverride",
      entityId: student.id,
      reason: input.reason,
      details: {
        studentEmail: student.email,
        studentName: student.fullName,
        courseId: input.courseId,
        courseTitle: course.title,
        lessonId: input.lessonId,
        quizId: input.quizId,
        action: input.action,
      },
    });

    return {
      success: true,
      message: `تم تنفيذ العملية (${input.action}) بنجاح للطالب ${student.fullName}`,
    };
  }
}

export const quizService = new QuizService();
