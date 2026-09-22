import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentService } from "./enrollment.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("EnrollmentService", () => {
  let mockPrisma: {
    course: { findUnique: ReturnType<typeof vi.fn> };
    user: { findUnique: ReturnType<typeof vi.fn> };
    enrollment: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let enrollmentService: EnrollmentService;

  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@kemix.com",
    fullName: "Admin",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const studentUser: AuthenticatedUser = {
    id: "student-1",
    email: "student@kemix.com",
    fullName: "Student",
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
      user: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    enrollmentService = new EnrollmentService(mockPrisma as unknown as PrismaClient);
  });

  describe("selfEnroll", () => {
    it("enrolls student successfully in published course", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        status: "PUBLISHED",
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.create.mockResolvedValue({
        id: "enr-1",
        userId: studentUser.id,
        courseId: "course-1",
        status: "ACTIVE",
        enrollmentType: "FREE_ENROLLMENT",
      });

      const result = await enrollmentService.selfEnroll(studentUser.id, "course-1");
      expect(result.id).toBe("enr-1");
      expect(result.status).toBe("ACTIVE");
    });

    it("rejects enrollment in unpublished course", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        status: "DRAFT",
      });

      await expect(
        enrollmentService.selfEnroll(studentUser.id, "course-1")
      ).rejects.toThrow("Cannot enroll in an unpublished course");
    });

    it("returns existing active enrollment if already enrolled", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        status: "PUBLISHED",
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enr-existing",
        userId: studentUser.id,
        courseId: "course-1",
        status: "ACTIVE",
      });

      const result = await enrollmentService.selfEnroll(studentUser.id, "course-1");
      expect(result.id).toBe("enr-existing");
    });
  });

  describe("adminAssign", () => {
    it("allows ADMIN to assign enrollment to student", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: studentUser.id });
      mockPrisma.course.findUnique.mockResolvedValue({ id: "course-1" });
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.create.mockResolvedValue({
        id: "enr-admin-1",
        userId: studentUser.id,
        courseId: "course-1",
        status: "ACTIVE",
        enrollmentType: "ADMIN_ASSIGNED",
      });

      const result = await enrollmentService.adminAssign(adminUser, {
        userId: studentUser.id,
        courseId: "course-1",
      });

      expect(result.id).toBe("enr-admin-1");
      expect(result.enrollmentType).toBe("ADMIN_ASSIGNED");
    });

    it("rejects non-admin from using adminAssign", async () => {
      await expect(
        enrollmentService.adminAssign(studentUser, {
          userId: "some-user",
          courseId: "course-1",
        })
      ).rejects.toThrow("Forbidden");
    });
  });
});
