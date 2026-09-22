import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  LessonProgressDto,
  CourseProgressDto,
  UpdateLessonProgressInput,
  LessonUnlockStatusDto,
} from "@/server/domain/progress/progress.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IProgressService } from "./progress.service.interface";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";

export class ProgressService implements IProgressService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    input: UpdateLessonProgressInput
  ): Promise<LessonProgressDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const courseId = lesson.section.courseId;

    // Verify user is enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      throw new Error("Forbidden: You must be enrolled in this course to track progress");
    }

    const progressPercent =
      input.progressPercent !== undefined
        ? Math.max(0, Math.min(100, Math.floor(input.progressPercent)))
        : undefined;

    const isCompleted =
      input.completed !== undefined
        ? input.completed
        : progressPercent === 100
        ? true
        : undefined;

    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    let progress: LessonProgressDto;

    if (existingProgress) {
      const markCompleted =
        isCompleted !== undefined ? isCompleted : existingProgress.completed;
      const completedAt =
        markCompleted && !existingProgress.completed
          ? new Date()
          : !markCompleted
          ? null
          : existingProgress.completedAt;

      progress = await this.prisma.lessonProgress.update({
        where: { id: existingProgress.id },
        data: {
          courseId,
          ...(progressPercent !== undefined && { progressPercent }),
          ...(markCompleted !== undefined && { completed: markCompleted }),
          completedAt,
          ...(input.lastPositionSeconds !== undefined && {
            lastPositionSeconds: input.lastPositionSeconds,
          }),
        },
      });
    } else {
      const markCompleted = isCompleted ?? (progressPercent === 100);
      const completedAt = markCompleted ? new Date() : null;

      progress = await this.prisma.lessonProgress.create({
        data: {
          userId,
          lessonId,
          courseId,
          progressPercent: progressPercent ?? (markCompleted ? 100 : 0),
          completed: markCompleted,
          completedAt,
          lastPositionSeconds: input.lastPositionSeconds ?? 0,
        },
      });
    }

    // Check if whole course is completed and update enrollment
    await this.checkAndUpdateEnrollmentCompletion(userId, courseId);

    return progress;
  }

  async calculateCourseCompletion(
    userId: string,
    courseId: string
  ): Promise<{
    totalLessons: number;
    completedLessons: number;
    percentage: number;
    isCompleted: boolean;
  }> {
    const publishedLessons = await this.prisma.lesson.findMany({
      where: {
        section: { courseId },
        isPublished: true,
      },
      select: { id: true },
    });

    const totalLessons = publishedLessons.length;
    if (totalLessons === 0) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        isCompleted: false,
      };
    }

    const publishedLessonIds = publishedLessons.map((l) => l.id);

    const completedProgressCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: publishedLessonIds },
        completed: true,
      },
    });

    const percentage = Math.floor((completedProgressCount / totalLessons) * 100);
    const isCompleted = completedProgressCount === totalLessons && totalLessons > 0;

    return {
      totalLessons,
      completedLessons: completedProgressCount,
      percentage,
      isCompleted,
    };
  }

  private async checkAndUpdateEnrollmentCompletion(
    userId: string,
    courseId: string
  ): Promise<void> {
    const { isCompleted } = await this.calculateCourseCompletion(userId, courseId);

    if (isCompleted) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (enrollment && enrollment.status === "ACTIVE") {
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }
    }
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
    requestingUser: AuthenticatedUser
  ): Promise<CourseProgressDto> {
    const isSelf = requestingUser.id === userId;
    const isAdmin = requestingUser.role === "ADMIN";

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const isCourseInstructor =
      requestingUser.role === "INSTRUCTOR" && course.instructorId === requestingUser.id;

    if (!isSelf && !isAdmin && !isCourseInstructor) {
      throw new Error("Forbidden: You do not have permission to view this progress");
    }

    const { totalLessons, completedLessons, percentage, isCompleted } =
      await this.calculateCourseCompletion(userId, courseId);

    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        courseId,
      },
    });

    return {
      courseId,
      userId,
      totalLessons,
      completedLessons,
      completionPercentage: percentage,
      isCompleted,
      lessonProgressList: progressList,
    };
  }
  async checkLessonUnlockStatus(
    userId: string,
    lessonId: string
  ): Promise<LessonUnlockStatusDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              include: {
                sections: {
                  orderBy: { sortOrder: "asc" },
                  include: {
                    lessons: {
                      where: { isPublished: true, isArchived: false },
                      orderBy: { sortOrder: "asc" },
                      include: { quizzes: true, tasks: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return { lessonId, isUnlocked: false, lockReason: "الدرس غير موجود" };
    }

    // Check if user has manual override
    const userProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (userProgress?.isManuallyUnlocked) {
      return { lessonId, isUnlocked: true };
    }

    // If free preview, it's always unlocked
    if (lesson.isFreePreview) {
      return { lessonId, isUnlocked: true };
    }

    // If unlock rule is IMMEDIATE, unlocked
    if (lesson.unlockRule === "IMMEDIATE") {
      return { lessonId, isUnlocked: true };
    }

    // Flatten all lessons in chronological course curriculum
    const allOrderedLessons: { id: string; title: string; unlockRule: string }[] = [];
    for (const sec of lesson.section.course.sections) {
      for (const les of sec.lessons) {
        allOrderedLessons.push({ id: les.id, title: les.title, unlockRule: les.unlockRule });
      }
    }

    const currentIndex = allOrderedLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex <= 0) {
      // First lesson is always unlocked
      return { lessonId, isUnlocked: true };
    }

    const previousLesson = allOrderedLessons[currentIndex - 1];

    if (lesson.unlockRule === "PREVIOUS_LESSON") {
      const prevProgress = await this.prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: previousLesson.id,
          },
        },
      });

      if (!prevProgress || (!prevProgress.completed && !prevProgress.isManuallyUnlocked)) {
        return {
          lessonId,
          isUnlocked: false,
          lockReason: `يجب إكمال المحاضرة السابقة أولاً: "${previousLesson.title}"`,
        };
      }
      return { lessonId, isUnlocked: true };
    }

    if (lesson.unlockRule === "TASK_SUBMISSION") {
      // Check if previous lesson's tasks are submitted
      const prevTasks = await this.prisma.task.findMany({
        where: { lessonId: previousLesson.id, isPublished: true, isArchived: false },
      });

      if (prevTasks.length > 0) {
        const taskIds = prevTasks.map((t) => t.id);
        const submissionCount = await this.prisma.taskSubmission.count({
          where: {
            taskId: { in: taskIds },
            userId,
          },
        });

        if (submissionCount < prevTasks.length) {
          return {
            lessonId,
            isUnlocked: false,
            lockReason: `يجب تسليم تكليف المحاضرة السابقة أولاً: "${previousLesson.title}"`,
          };
        }
      }
      return { lessonId, isUnlocked: true };
    }

    if (lesson.unlockRule === "QUIZ_PASS") {
      // Check if previous lesson's quiz was passed
      const prevQuizzes = await this.prisma.quiz.findMany({
        where: { lessonId: previousLesson.id, isPublished: true, isArchived: false },
      });

      if (prevQuizzes.length > 0) {
        const quizIds = prevQuizzes.map((q) => q.id);
        const passedAttempt = await this.prisma.quizAttempt.findFirst({
          where: {
            quizId: { in: quizIds },
            userId,
            passed: true,
          },
        });

        if (!passedAttempt) {
          return {
            lessonId,
            isUnlocked: false,
            lockReason: `يجب اجتياز اختبار المحاضرة السابقة بنجاح أولاً: "${previousLesson.title}"`,
          };
        }
      }
      return { lessonId, isUnlocked: true };
    }

    return { lessonId, isUnlocked: true };
  }
}

export const progressService = new ProgressService();

