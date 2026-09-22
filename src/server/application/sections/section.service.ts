import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  CourseSectionDto,
  CreateSectionInput,
  UpdateSectionInput,
  ReorderSectionsInput,
} from "@/server/domain/sections/section.types";
import { LessonDto } from "@/server/domain/lessons/lesson.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { ISectionService } from "./section.service.interface";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";

export class SectionService implements ISectionService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  async createSection(
    courseId: string,
    user: AuthenticatedUser,
    input: CreateSectionInput
  ): Promise<CourseSectionDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You do not have permission to modify this course");
    }

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const highestOrder = await this.prisma.courseSection.findFirst({
        where: { courseId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highestOrder ? highestOrder.sortOrder + 1 : 0;
    }

    const section = await this.prisma.courseSection.create({
      data: {
        courseId,
        title: input.title,
        description: input.description,
        sortOrder,
      },
    });

    return section;
  }

  async updateSection(
    sectionId: string,
    user: AuthenticatedUser,
    input: UpdateSectionInput
  ): Promise<CourseSectionDto> {
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
      throw new Error("Forbidden: You do not have permission to modify this section");
    }

    const updated = await this.prisma.courseSection.update({
      where: { id: sectionId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });

    return updated;
  }

  async deleteSection(sectionId: string, user: AuthenticatedUser): Promise<void> {
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
      throw new Error("Forbidden: You do not have permission to modify this section");
    }

    await this.prisma.courseSection.delete({
      where: { id: sectionId },
    });
  }

  async listSections(
    courseId: string,
    user?: AuthenticatedUser | null
  ): Promise<(CourseSectionDto & { lessons?: LessonDto[] })[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, course) : false;

    if (course.status !== "PUBLISHED" && !canManage) {
      throw new Error("Course not found or access denied");
    }

    const sections = await this.prisma.courseSection.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          where: canManage ? {} : { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return sections;
  }

  async reorderSections(
    courseId: string,
    user: AuthenticatedUser,
    input: ReorderSectionsInput
  ): Promise<CourseSectionDto[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You do not have permission to modify this course");
    }

    // Execute in transaction
    await this.prisma.$transaction(
      input.sectionOrders.map(({ id, sortOrder }) =>
        this.prisma.courseSection.update({
          where: { id, courseId },
          data: { sortOrder },
        })
      )
    );

    return this.prisma.courseSection.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const sectionService = new SectionService();
