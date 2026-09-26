import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  CourseDto,
  CreateCourseInput,
  UpdateCourseInput,
  CourseFilterParams,
} from "@/server/domain/courses/course.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { ICourseService } from "./course.service.interface";
import { generateSlug } from "@/server/domain/courses/slug-generator";
import { courseAccessService, CourseAccessService } from "./course-access.service";
import { hasPermission } from "@/server/domain/security/rbac.types";

const courseInstructorInclude = {
  instructor: {
    select: { id: true, fullName: true, avatarUrl: true, bio: true },
  },
  coInstructors: {
    include: {
      instructor: {
        select: { id: true, fullName: true, avatarUrl: true, bio: true },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export class CourseService implements ICourseService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  private async ensureUniqueSlug(title: string, requestedSlug?: string, excludeCourseId?: string): Promise<string> {
    const baseSlug = requestedSlug ? generateSlug(requestedSlug) : generateSlug(title);
    let finalSlug = baseSlug || `course-${Date.now()}`;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.course.findUnique({
        where: { slug: finalSlug },
        select: { id: true },
      });

      if (!existing || (excludeCourseId && existing.id === excludeCourseId)) {
        return finalSlug;
      }

      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async createCourse(
    instructorId: string,
    input: CreateCourseInput
  ): Promise<CourseDto> {
    const slug = await this.ensureUniqueSlug(input.title, input.slug);

    const isFree = input.isFree !== undefined ? input.isFree : (input.price === undefined || input.price === 0);

    const course = await this.prisma.course.create({
      data: {
        title: input.title,
        slug,
        shortDescription: input.shortDescription,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        level: input.level ?? "ALL_LEVELS",
        price: input.price ?? 0,
        currency: input.currency ?? "EGP",
        isFree,
        certificatesEnabled: input.certificatesEnabled ?? false,
        tools: input.tools ?? [],
        requirements: input.requirements,
        whatYouWillLearn: input.whatYouWillLearn ?? [],
        sortOrder: input.sortOrder ?? 0,
        durationSeconds: input.durationSeconds ?? 0,
        status: "DRAFT",
        instructorId,
      },
      include: {
        ...courseInstructorInclude,
      },
    });

    return course;
  }

  async updateCourse(
    courseId: string,
    user: AuthenticatedUser,
    input: UpdateCourseInput
  ): Promise<CourseDto> {
    const existing = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        title: true,
        status: true,
        coInstructors: { select: { instructorId: true } },
      },
    });

    if (!existing) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, existing)) {
      throw new Error("Forbidden: You do not have permission to edit this course");
    }

    if (input.coInstructorIds !== undefined && user.role !== "ADMIN") {
      throw new Error("Forbidden: Only admins can assign course instructors");
    }

    let slug: string | undefined;
    if (input.slug || (input.title && input.title !== existing.title && !input.slug)) {
      slug = await this.ensureUniqueSlug(input.title ?? existing.title, input.slug, courseId);
    }

    const updateData: Prisma.CourseUpdateInput = {
      ...(input.title !== undefined && { title: input.title }),
      ...(slug !== undefined && { slug }),
      ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl }),
      ...(input.level !== undefined && { level: input.level }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.isFree !== undefined && { isFree: input.isFree }),
      ...(input.certificatesEnabled !== undefined && { certificatesEnabled: input.certificatesEnabled }),
      ...(input.tools !== undefined && { tools: input.tools }),
      ...(input.requirements !== undefined && { requirements: input.requirements }),
      ...(input.whatYouWillLearn !== undefined && { whatYouWillLearn: input.whatYouWillLearn }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
      ...(input.status !== undefined && { status: input.status }),
    };

    if (input.coInstructorIds !== undefined) {
      const coInstructorIds = [...new Set(input.coInstructorIds)].filter(
        (instructorId) => instructorId !== existing.instructorId
      );
      const validInstructors = await this.prisma.user.findMany({
        where: { id: { in: coInstructorIds }, role: "INSTRUCTOR" },
        select: { id: true },
      });
      if (validInstructors.length !== coInstructorIds.length) {
        throw new Error("One or more selected users are not instructors");
      }
      updateData.coInstructors = {
        deleteMany: {},
        create: coInstructorIds.map((instructorId) => ({
          instructor: { connect: { id: instructorId } },
        })),
      };
    }

    if (input.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        ...courseInstructorInclude,
      },
    });

    return updated;
  }

  async getCourseById(
    courseId: string,
    user?: AuthenticatedUser | null
  ): Promise<CourseDto & { isEnrolled?: boolean; canManage?: boolean }> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        ...courseInstructorInclude,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, course) : false;

    if (course.status !== "PUBLISHED" && !canManage) {
      throw new Error("Course not found or access denied");
    }

    let isEnrolled = false;
    if (user) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!(enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED"));
    }

    return {
      ...course,
      isEnrolled,
      canManage,
    };
  }

  async getCourseBySlug(
    slug: string,
    user?: AuthenticatedUser | null
  ): Promise<CourseDto & { isEnrolled?: boolean; canManage?: boolean }> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        ...courseInstructorInclude,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, course) : false;

    if (course.status !== "PUBLISHED" && !canManage) {
      throw new Error("Course not found or access denied");
    }

    let isEnrolled = false;
    if (user) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!(enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED"));
    }

    return {
      ...course,
      isEnrolled,
      canManage,
    };
  }

  async listCourses(
    params: CourseFilterParams,
    user?: AuthenticatedUser | null
  ): Promise<{ courses: CourseDto[]; total: number; page: number; limit: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    // For non-admin/non-instructors, restrict to PUBLISHED courses
    if (!user || user.role === "STUDENT") {
      where.status = "PUBLISHED";
    } else if (user.role === "INSTRUCTOR") {
      if (params.status) {
        where.status = params.status;
      }
      // If instructor queries their own, filter by instructorId; otherwise allow browsing published or own
      if (params.instructorId) {
        where.AND = [
          { OR: [
            { instructorId: params.instructorId },
            { coInstructors: { some: { instructorId: params.instructorId } } },
          ] },
        ];
      }
    } else if (user.role === "ADMIN") {
      if (params.status) {
        where.status = params.status;
      }
      if (params.instructorId) {
        where.AND = [
          { OR: [
            { instructorId: params.instructorId },
            { coInstructors: { some: { instructorId: params.instructorId } } },
          ] },
        ];
      }
    }

    if (params.level) {
      where.level = params.level;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: courseInstructorInclude,
      }),
    ]);

    return {
      courses,
      total,
      page,
      limit,
    };
  }

  async publishCourse(
    courseId: string,
    user: AuthenticatedUser,
    publish: boolean
  ): Promise<CourseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        status: true,
        coInstructors: { select: { instructorId: true } },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Checking publish permission
    const canPublish =
      hasPermission(user.role, "course:publish") ||
      (user.role === "INSTRUCTOR" && this.accessService.canManageCourse(user, course));

    if (!canPublish) {
      throw new Error("Forbidden: You do not have permission to publish this course");
    }

    const newStatus = publish ? "PUBLISHED" : "DRAFT";
    const publishedAt = publish ? new Date() : null;

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: newStatus,
        publishedAt,
      },
      include: courseInstructorInclude,
    });

    return updated;
  }

  async deleteCourse(courseId: string, user: AuthenticatedUser): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        coInstructors: { select: { instructorId: true } },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Only Admin can delete or Instructor if permitted
    const canDelete =
      hasPermission(user.role, "course:delete") ||
      (user.role === "INSTRUCTOR" && this.accessService.canManageCourse(user, course));

    if (!canDelete) {
      throw new Error("Forbidden: You do not have permission to delete this course");
    }

    await this.prisma.course.delete({
      where: { id: courseId },
    });
  }
}

export const courseService = new CourseService();
