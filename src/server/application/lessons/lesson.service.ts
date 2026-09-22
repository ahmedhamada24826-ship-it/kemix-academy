import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  LessonDto,
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from "@/server/domain/lessons/lesson.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { ILessonService } from "./lesson.service.interface";
import { generateUnicodeSlug } from "@/server/domain/courses/slug-generator";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";

export class LessonService implements ILessonService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  private async ensureUniqueLessonSlug(
    sectionId: string,
    title: string,
    requestedSlug?: string,
    excludeLessonId?: string
  ): Promise<string> {
    const baseSlug = requestedSlug ? generateUnicodeSlug(requestedSlug) : generateUnicodeSlug(title);
    const fallbackSlug = baseSlug || `lesson-${Date.now()}`;
    let finalSlug = fallbackSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.lesson.findUnique({
        where: {
          sectionId_slug: {
            sectionId,
            slug: finalSlug,
          },
        },
        select: { id: true },
      });

      if (!existing || (excludeLessonId && existing.id === excludeLessonId)) {
        return finalSlug;
      }

      finalSlug = `${fallbackSlug}-${counter}`;
      counter++;
    }
  }

  async createLesson(
    sectionId: string,
    user: AuthenticatedUser,
    input: CreateLessonInput
  ): Promise<LessonDto> {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: { id: true, instructorId: true },
        },
      },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (!this.accessService.canManageCourse(user, section.course)) {
      throw new Error("Forbidden: You do not have permission to add lessons to this course");
    }

    const slug = await this.ensureUniqueLessonSlug(sectionId, input.title, input.slug);

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const highestOrder = await this.prisma.lesson.findFirst({
        where: { sectionId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highestOrder ? highestOrder.sortOrder + 1 : 0;
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        title: input.title,
        slug,
        description: input.description,
        lessonType: input.lessonType ?? "VIDEO",
        videoSource: input.videoSource ?? "UPLOAD",
        videoProvider: input.videoProvider,
        videoUrl: input.videoUrl,
        unlockRule: input.unlockRule ?? "IMMEDIATE",
        content: input.content,
        storageKey: input.storageKey,
        sortOrder,
        isPublished: input.isPublished ?? false,
        isFreePreview: input.isFreePreview ?? false,
        durationSeconds: input.durationSeconds ?? 0,
      },
    });

    return lesson;
  }

  async updateLesson(
    lessonId: string,
    user: AuthenticatedUser,
    input: UpdateLessonInput
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              select: { id: true, instructorId: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (!this.accessService.canManageCourse(user, lesson.section.course)) {
      throw new Error("Forbidden: You do not have permission to modify this lesson");
    }

    let slug: string | undefined;
    if (input.slug || (input.title && input.title !== lesson.title && !input.slug)) {
      slug = await this.ensureUniqueLessonSlug(
        lesson.sectionId,
        input.title ?? lesson.title,
        input.slug,
        lessonId
      );
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(slug !== undefined && { slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.lessonType !== undefined && { lessonType: input.lessonType }),
        ...(input.videoSource !== undefined && { videoSource: input.videoSource }),
        ...(input.videoProvider !== undefined && { videoProvider: input.videoProvider }),
        ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
        ...(input.unlockRule !== undefined && { unlockRule: input.unlockRule }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.storageKey !== undefined && { storageKey: input.storageKey }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(input.isFreePreview !== undefined && { isFreePreview: input.isFreePreview }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
        ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
      },
    });

    return updated;
  }

  async deleteLesson(lessonId: string, user: AuthenticatedUser): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              select: { id: true, instructorId: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (!this.accessService.canManageCourse(user, lesson.section.course)) {
      throw new Error("Forbidden: You do not have permission to delete this lesson");
    }

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  async getLessonById(
    lessonId: string,
    user?: AuthenticatedUser | null
  ): Promise<LessonDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              select: { id: true, status: true, instructorId: true },
            },
          },
        },
        files: {
          orderBy: { createdAt: "asc" },
        },
        quizzes: {
          where: { isPublished: true, isArchived: false },
          orderBy: { createdAt: "asc" },
          include: {
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const access = await this.accessService.canAccessLesson(user ?? null, lesson);
    if (!access.allowed) {
      throw new Error(access.reason || "Access denied to this lesson");
    }

    const canManage = user
      ? this.accessService.canManageCourse(user, lesson.section.course)
      : false;

    // Non-managers never receive correct answers or explanations.
    const quizzes = (lesson.quizzes ?? []).map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        explanation: canManage ? question.explanation : null,
        options: question.options.map((option) => ({
          id: option.id,
          questionId: option.questionId,
          text: option.text,
          sortOrder: option.sortOrder,
          ...(canManage ? { isCorrect: option.isCorrect } : {}),
        })),
      })),
    }));

    return {
      ...lesson,
      quizzes,
    } as LessonDto;
  }

  async listLessonsBySection(
    sectionId: string,
    user?: AuthenticatedUser | null
  ): Promise<LessonDto[]> {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: { id: true, status: true, instructorId: true },
        },
      },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, section.course) : false;

    if (section.course.status !== "PUBLISHED" && !canManage) {
      throw new Error("Course not found or access denied");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        sectionId,
        ...(canManage ? {} : { isPublished: true }),
      },
      orderBy: { sortOrder: "asc" },
    });

    return lessons;
  }

  async reorderLessons(
    sectionId: string,
    user: AuthenticatedUser,
    input: ReorderLessonsInput
  ): Promise<LessonDto[]> {
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: { id: true, instructorId: true },
        },
      },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (!this.accessService.canManageCourse(user, section.course)) {
      throw new Error("Forbidden: You do not have permission to modify this course");
    }

    await this.prisma.$transaction(
      input.lessonOrders.map(({ id, sortOrder }) =>
        this.prisma.lesson.update({
          where: { id, sectionId },
          data: { sortOrder },
        })
      )
    );

    return this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const lessonService = new LessonService();
