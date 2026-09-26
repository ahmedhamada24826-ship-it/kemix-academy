import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  TaskDto,
  TaskSubmissionDto,
  CreateTaskInput,
  UpdateTaskInput,
  SubmitTaskInput,
  GradeTaskSubmissionInput,
} from "@/server/domain/tasks/task.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { ITaskService } from "./task.service.interface";
import { courseAccessService, CourseAccessService } from "../courses/course-access.service";
import { auditLogService } from "../audit/audit.service";

export class TaskService implements ITaskService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly accessService: CourseAccessService = courseAccessService
  ) {}

  async createTask(
    user: AuthenticatedUser,
    input: CreateTaskInput
  ): Promise<TaskDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You cannot create tasks for this course");
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: input.lessonId },
      select: { id: true, section: { select: { courseId: true } } },
    });

    if (!lesson || lesson.section.courseId !== input.courseId) {
      throw new Error("Lesson does not belong to the specified course");
    }

    const task = await this.prisma.task.create({
      data: {
        courseId: input.courseId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        deadline: input.deadline,
        maxFileSizeMb: input.maxFileSizeMb ?? 50,
        allowedFileTypes:
          input.allowedFileTypes ??
          "pdf,zip,doc,docx,xlsx,xls,csv,png,jpg,jpeg",
        maxAttempts: input.maxAttempts ?? 1,
        isPublished: input.isPublished ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      details: { title: task.title, courseId: task.courseId, lessonId: task.lessonId },
    });

    return task;
  }

  async updateTask(
    taskId: string,
    user: AuthenticatedUser,
    input: UpdateTaskInput
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!this.accessService.canManageCourse(user, task.course)) {
      throw new Error("Forbidden: You cannot update this task");
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.deadline !== undefined && { deadline: input.deadline }),
        ...(input.maxFileSizeMb !== undefined && { maxFileSizeMb: input.maxFileSizeMb }),
        ...(input.allowedFileTypes !== undefined && { allowedFileTypes: input.allowedFileTypes }),
        ...(input.maxAttempts !== undefined && { maxAttempts: input.maxAttempts }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "TASK_UPDATED",
      entity: "Task",
      entityId: taskId,
      details: { title: updated.title },
    });

    return updated;
  }

  async deleteTask(taskId: string, user: AuthenticatedUser): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!this.accessService.canManageCourse(user, task.course)) {
      throw new Error("Forbidden: You cannot delete this task");
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "TASK_DELETED",
      entity: "Task",
      entityId: taskId,
      details: { title: task.title },
    });
  }

  async getTaskById(
    taskId: string,
    user?: AuthenticatedUser | null
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, title: true, status: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const canManage = user ? this.accessService.canManageCourse(user, task.course) : false;

    if (!task.isPublished && !canManage) {
      throw new Error("Task not found or unpublished");
    }

    let userSubmission: TaskSubmissionDto | null = null;
    if (user) {
      const submission = await this.prisma.taskSubmission.findFirst({
        where: { taskId, userId: user.id },
        orderBy: { attemptNumber: "desc" },
      });
      userSubmission = submission;
    }

    const submissionsCount = canManage
      ? await this.prisma.taskSubmission.count({ where: { taskId } })
      : undefined;

    return {
      ...task,
      userSubmission,
      submissionsCount,
    };
  }

  async listTasksByLesson(
    lessonId: string,
    user?: AuthenticatedUser | null
  ): Promise<TaskDto[]> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: { select: { id: true, status: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const canManage = user
      ? this.accessService.canManageCourse(user, lesson.section.course)
      : false;

    const tasks = await this.prisma.task.findMany({
      where: {
        lessonId,
        ...(canManage ? {} : { isPublished: true, isArchived: false }),
      },
      orderBy: { sortOrder: "asc" },
    });

    if (!user || canManage) {
      return tasks;
    }

    // Attach user submission status for students
    const taskIds = tasks.map((t) => t.id);
    const submissions = await this.prisma.taskSubmission.findMany({
      where: {
        taskId: { in: taskIds },
        userId: user.id,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const subMap = new Map<string, TaskSubmissionDto>();
    for (const sub of submissions) {
      if (!subMap.has(sub.taskId)) {
        subMap.set(sub.taskId, sub);
      }
    }

    return tasks.map((t) => ({
      ...t,
      userSubmission: subMap.get(t.id) || null,
    }));
  }

  async listTasksByCourse(
    courseId: string,
    user: AuthenticatedUser
  ): Promise<TaskDto[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!this.accessService.canManageCourse(user, course)) {
      throw new Error("Forbidden: You cannot view all course tasks");
    }

    const tasks = await this.prisma.task.findMany({
      where: { courseId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    return tasks.map((t) => ({
      ...t,
      submissionsCount: t._count.submissions,
    }));
  }

  async listAllTasks(user: AuthenticatedUser): Promise<TaskDto[]> {
    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      throw new Error("Forbidden: Only administrators and instructors can list tasks");
    }

    const whereClause =
      user.role === "ADMIN"
        ? {}
        : {
            course: {
              OR: [
                { instructorId: user.id },
                { coInstructors: { some: { instructorId: user.id } } },
              ],
            },
          };

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "desc" }],
      include: {
        course: { select: { id: true, title: true } },
        lesson: { select: { id: true, title: true } },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return tasks.map((t) => ({
      ...t,
      submissionsCount: t._count.submissions,
      course: t.course,
      lesson: t.lesson,
    }));
  }

  async submitTask(
    taskId: string,
    user: AuthenticatedUser,
    input: SubmitTaskInput
  ): Promise<TaskSubmissionDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, status: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!task.isPublished || task.isArchived) {
      throw new Error("This task is not available for submissions");
    }

    const access = await this.accessService.canAccessCourse(user, task.course);
    if (!access.allowed) {
      throw new Error(access.reason || "You must be enrolled to submit tasks");
    }

    // Check attempts limit
    const pastAttemptsCount = await this.prisma.taskSubmission.count({
      where: { taskId, userId: user.id },
    });

    if (task.maxAttempts > 0 && pastAttemptsCount >= task.maxAttempts) {
      throw new Error(`Maximum attempts reached (${task.maxAttempts}) for this task`);
    }

    // Check deadline
    let status: "SUBMITTED" | "LATE" = "SUBMITTED";
    if (task.deadline && new Date() > new Date(task.deadline)) {
      status = "LATE";
    }

    const submission = await this.prisma.taskSubmission.create({
      data: {
        taskId,
        userId: user.id,
        attemptNumber: pastAttemptsCount + 1,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        textResponse: input.textResponse,
        status,
        submittedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return submission;
  }

  async listSubmissions(
    taskId: string,
    user: AuthenticatedUser
  ): Promise<TaskSubmissionDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (!this.accessService.canManageCourse(user, task.course)) {
      throw new Error("Forbidden: You cannot view submissions for this task");
    }

    const submissions = await this.prisma.taskSubmission.findMany({
      where: { taskId },
      orderBy: { submittedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return submissions;
  }

  async getUserSubmission(
    taskId: string,
    userId: string,
    user: AuthenticatedUser
  ): Promise<TaskSubmissionDto | null> {
    const isSelf = user.id === userId;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        course: { select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const canManage = this.accessService.canManageCourse(user, task.course);

    if (!isSelf && !canManage) {
      throw new Error("Forbidden: You cannot view this submission");
    }

    const submission = await this.prisma.taskSubmission.findFirst({
      where: { taskId, userId },
      orderBy: { attemptNumber: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    user: AuthenticatedUser,
    input: GradeTaskSubmissionInput
  ): Promise<TaskSubmissionDto> {
    const submission = await this.prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            course: { select: { id: true, instructorId: true, coInstructors: { select: { instructorId: true } } } },
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Task submission not found");
    }

    if (!this.accessService.canManageCourse(user, submission.task.course)) {
      throw new Error("Forbidden: You cannot grade this submission");
    }

    const updated = await this.prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        score: input.score,
        feedback: input.feedback,
        status: input.status ?? "REVIEWED",
        reviewerId: user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "TASK_SUBMISSION_GRADED",
      entity: "TaskSubmission",
      entityId: submissionId,
      details: {
        taskId: submission.taskId,
        studentId: submission.userId,
        score: input.score,
      },
    });

    return updated;
  }
}

export const taskService = new TaskService();
