import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  PaymentRequestDto,
  CreatePaymentRequestInput,
  ReviewPaymentRequestInput,
  UpdatePaymentRequestInput,
  PaymentRequestFilterParams,
} from "@/server/domain/payments/payment.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IPaymentService } from "./payment.service.interface";
import { platformSettingsService } from "../settings/settings.service";
import { auditLogService } from "../audit/audit.service";

export class PaymentService implements IPaymentService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async createPaymentRequest(
    user: AuthenticatedUser,
    input: CreatePaymentRequestInput
  ): Promise<{ request: PaymentRequestDto; whatsappUrl: string }> {
    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        currency: true,
        isFree: true,
        status: true,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.status !== "PUBLISHED") {
      throw new Error("Course is not available for enrollment");
    }

    // Check if already actively enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
      throw new Error("You are already enrolled in this course");
    }

    // Check if there is already a pending request
    let request = await this.prisma.paymentRequest.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!request) {
      request = await this.prisma.paymentRequest.create({
        data: {
          userId: user.id,
          courseId: course.id,
          amount: course.price,
          currency: course.currency,
          status: "PENDING",
          studentName: user.fullName,
          studentEmail: user.email,
          studentPhone: input.studentPhone,
          notes: input.notes,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      });
    }

    const student = {
      id: request.user?.id ?? user.id,
      fullName: request.user?.fullName ?? user.fullName,
      email: request.user?.email ?? user.email,
      phone: input.studentPhone ?? request.studentPhone ?? null,
    };

    const { whatsappUrl } = await platformSettingsService.buildWhatsAppUrl({
      courseName: course.title,
      price: course.price,
      currency: course.currency,
      studentName: user.fullName,
      studentEmail: user.email,
      studentPhone: input.studentPhone,
    });

    return {
      request: { ...request, student },
      whatsappUrl,
    };
  }

  async listPaymentRequests(
    user: AuthenticatedUser,
    params: PaymentRequestFilterParams
  ): Promise<{ requests: PaymentRequestDto[]; total: number; page: number; limit: number }> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can view payment requests");
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentRequestWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.courseId) {
      where.courseId = params.courseId;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.search) {
      where.OR = [
        { studentName: { contains: params.search, mode: "insensitive" } },
        { studentEmail: { contains: params.search, mode: "insensitive" } },
        { course: { title: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.paymentRequest.count({ where }),
      this.prisma.paymentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    const requestsWithStudent = requests.map((req) => ({
      ...req,
      student: {
        id: req.user?.id ?? req.userId,
        fullName: req.user?.fullName ?? req.studentName,
        email: req.user?.email ?? req.studentEmail,
        phone: req.studentPhone,
      },
    }));

    return {
      requests: requestsWithStudent as PaymentRequestDto[],
      total,
      page,
      limit,
    };
  }

  async getPaymentRequestById(
    requestId: string,
    user: AuthenticatedUser
  ): Promise<PaymentRequestDto> {
    const request = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!request) {
      throw new Error("Payment request not found");
    }

    const isSelf = user.id === request.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isSelf && !isAdmin) {
      throw new Error("Forbidden: You cannot view this payment request");
    }

    return {
      ...request,
      student: {
        id: request.user.id,
        fullName: request.user.fullName,
        email: request.user.email,
      },
    };
  }

  async reviewPaymentRequest(
    requestId: string,
    user: AuthenticatedUser,
    input: ReviewPaymentRequestInput
  ): Promise<PaymentRequestDto> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can review payment requests");
    }

    const request = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: {
        course: true,
      },
    });

    if (!request) {
      throw new Error("Payment request not found");
    }

    if (request.status !== "PENDING") {
      throw new Error(`Request has already been ${request.status.toLowerCase()}`);
    }

    if (input.status === "APPROVED") {
      // Create or activate enrollment in a transaction
      const [updatedRequest] = await this.prisma.$transaction([
        this.prisma.paymentRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedById: user.id,
            reviewedAt: new Date(),
          },
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            course: { select: { id: true, title: true, slug: true } },
            reviewedBy: { select: { id: true, fullName: true } },
          },
        }),
        this.prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: request.userId,
              courseId: request.courseId,
            },
          },
          create: {
            userId: request.userId,
            courseId: request.courseId,
            status: "ACTIVE",
            enrollmentType: "PURCHASED",
          },
          update: {
            status: "ACTIVE",
            enrollmentType: "PURCHASED",
            enrolledAt: new Date(),
          },
        }),
      ]);

      await auditLogService.recordLog({
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.fullName,
        action: "PAYMENT_REQUEST_APPROVED",
        entity: "PaymentRequest",
        entityId: requestId,
        details: {
          studentId: request.userId,
          courseId: request.courseId,
          amount: request.amount,
          currency: request.currency,
        },
      });

      return {
        ...updatedRequest,
        student: updatedRequest.user
          ? {
              id: updatedRequest.user.id,
              fullName: updatedRequest.user.fullName,
              email: updatedRequest.user.email,
            }
          : { id: "", fullName: "", email: "" },
      };
    } else {
      const updatedRequest = await this.prisma.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: input.rejectionReason,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      });

      await auditLogService.recordLog({
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.fullName,
        action: "PAYMENT_REQUEST_REJECTED",
        entity: "PaymentRequest",
        entityId: requestId,
        reason: input.rejectionReason,
        details: {
          studentId: request.userId,
          courseId: request.courseId,
        },
      });

      return {
        ...updatedRequest,
        student: updatedRequest.user
          ? {
              id: updatedRequest.user.id,
              fullName: updatedRequest.user.fullName,
              email: updatedRequest.user.email,
            }
          : { id: "", fullName: "", email: "" },
      };
    }
  }

  async updatePaymentRequest(
    requestId: string,
    user: AuthenticatedUser,
    input: UpdatePaymentRequestInput
  ): Promise<PaymentRequestDto> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can update payment requests");
    }

    const updatedRequest = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: { studentPhone: input.studentPhone },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });

    return {
      ...updatedRequest,
      student: {
        id: updatedRequest.user?.id ?? updatedRequest.userId,
        fullName: updatedRequest.user?.fullName ?? updatedRequest.studentName,
        email: updatedRequest.user?.email ?? updatedRequest.studentEmail,
        phone: updatedRequest.studentPhone,
      },
    };
  }
}

export const paymentService = new PaymentService();
