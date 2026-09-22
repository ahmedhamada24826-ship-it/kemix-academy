import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskService } from "./task.service";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { CourseAccessService } from "../courses/course-access.service";

describe("TaskService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAccessService: any;
  let taskService: TaskService;

  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@kemix.com",
    fullName: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const studentUser: AuthenticatedUser = {
    id: "student-1",
    email: "student@kemix.com",
    fullName: "Student User",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      task: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      taskSubmission: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      lesson: {
        findUnique: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    mockAccessService = {
      canManageCourse: vi.fn(() => true),
      canAccessCourse: vi.fn().mockResolvedValue({ allowed: true, isEnrolled: true }),
    };

    taskService = new TaskService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("createTask", () => {
    it("allows admin to create a task", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: "course-1", instructorId: "admin-1" });
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        section: { courseId: "course-1" },
      });
      mockPrisma.task.create.mockResolvedValue({
        id: "task-1",
        courseId: "course-1",
        lessonId: "lesson-1",
        title: "Pandas Data Pipeline",
        description: "Build an automated pipeline",
        maxScore: 100,
        passingScore: 60,
      });

      const result = await taskService.createTask(adminUser, {
        courseId: "course-1",
        lessonId: "lesson-1",
        title: "Pandas Data Pipeline",
        description: "Build an automated pipeline",
      });

      expect(result.id).toBe("task-1");
      expect(result.title).toBe("Pandas Data Pipeline");
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });
  });

  describe("submitTask", () => {
    it("allows student to submit task solution", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        courseId: "course-1",
        isPublished: true,
        isArchived: false,
        maxAttempts: 2,
        course: { id: "course-1", status: "PUBLISHED" },
      });

      mockPrisma.taskSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.taskSubmission.create.mockResolvedValue({
        id: "sub-1",
        taskId: "task-1",
        userId: studentUser.id,
        status: "SUBMITTED",
        textResponse: "https://github.com/kemix/solution",
        submittedAt: new Date(),
      });

      const sub = await taskService.submitTask("task-1", studentUser, {
        textResponse: "https://github.com/kemix/solution",
      });

      expect(sub.id).toBe("sub-1");
      expect(sub.status).toBe("SUBMITTED");
    });
  });

  describe("gradeSubmission", () => {
    it("allows admin to grade a student submission", async () => {
      mockPrisma.taskSubmission.findUnique.mockResolvedValue({
        id: "sub-1",
        taskId: "task-1",
        userId: studentUser.id,
        task: {
          course: { id: "course-1", instructorId: "admin-1" },
        },
      });

      mockPrisma.taskSubmission.update.mockResolvedValue({
        id: "sub-1",
        status: "REVIEWED",
        score: 95,
        feedback: "Excellent optimization",
      });

      const graded = await taskService.gradeSubmission("sub-1", adminUser, {
        score: 95,
        feedback: "Excellent optimization",
      });

      expect(graded.status).toBe("REVIEWED");
      expect(graded.score).toBe(95);
    });
  });
});
