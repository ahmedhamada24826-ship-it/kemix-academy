import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "./payment.service";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

describe("PaymentService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  let paymentService: PaymentService;

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
      paymentRequest: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      course: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      platformSettings: {
        findUnique: vi.fn().mockResolvedValue({
          id: "global",
          whatsappNumber: "+201000000000",
          whatsappTemplate: "Course: {course_name}",
        }),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
    };

    paymentService = new PaymentService(mockPrisma as unknown as PrismaClient);
  });

  describe("createPaymentRequest", () => {
    it("creates a pending payment request for student", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        title: "Python Data Analysis",
        slug: "python-data-analysis",
        price: 500,
        currency: "EGP",
        status: "PUBLISHED",
        isFree: false,
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.paymentRequest.findFirst.mockResolvedValue(null);
      mockPrisma.paymentRequest.create.mockResolvedValue({
        id: "req-1",
        userId: studentUser.id,
        courseId: "course-1",
        amount: 500,
        currency: "EGP",
        status: "PENDING",
      });

      const { request, whatsappUrl } = await paymentService.createPaymentRequest(studentUser, {
        courseId: "course-1",
      });

      expect(request.id).toBe("req-1");
      expect(request.status).toBe("PENDING");
      expect(whatsappUrl).toContain("wa.me");
    });
  });

  describe("reviewPaymentRequest", () => {
    it("approves payment and auto-enrolls student into course", async () => {
      mockPrisma.paymentRequest.findUnique.mockResolvedValue({
        id: "req-1",
        userId: studentUser.id,
        courseId: "course-1",
        amount: 500,
        currency: "EGP",
        status: "PENDING",
        course: { id: "course-1", title: "Python Data Analysis" },
      });

      mockPrisma.paymentRequest.update.mockResolvedValue({
        id: "req-1",
        status: "APPROVED",
        reviewedById: adminUser.id,
      });

      mockPrisma.enrollment.upsert.mockResolvedValue({
        id: "enr-1",
        userId: studentUser.id,
        courseId: "course-1",
        status: "ACTIVE",
      });

      const updated = await paymentService.reviewPaymentRequest("req-1", adminUser, {
        status: "APPROVED",
      });

      expect(updated.status).toBe("APPROVED");
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
