import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  CertificateDto,
  CertificateVerificationDto,
} from "@/server/domain/certificates/certificate.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { ICertificateService } from "./certificate.service.interface";
import { progressService, ProgressService } from "../progress/progress.service";

export class CertificateService implements ICertificateService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly progService: ProgressService = progressService
  ) {}

  private generateCertificateCode(): string {
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `KEMIX-${timestamp}-${randomHex}`;
  }

  async claimCertificate(userId: string, courseId: string): Promise<CertificateDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true, status: true, certificatesEnabled: true },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!course.certificatesEnabled) {
      throw new Error("Certificate issuance is not enabled for this course");
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      throw new Error("You must be actively enrolled in the course to earn a certificate");
    }

    const existingCert = await this.prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    if (existingCert) {
      return existingCert as unknown as CertificateDto;
    }

    // Verify course completion requirements
    const completion = await this.progService.calculateCourseCompletion(userId, courseId);
    if (!completion.isCompleted) {
      throw new Error(
        `Course requirements not met: ${completion.completedLessons}/${completion.totalLessons} lessons completed (${completion.percentage}%)`
      );
    }

    let certificateCode = this.generateCertificateCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const collision = await this.prisma.certificate.findUnique({
        where: { certificateCode },
      });
      if (!collision) {
        isUnique = true;
      } else {
        certificateCode = this.generateCertificateCode();
        attempts++;
      }
    }

    const verificationToken = crypto.randomUUID();

    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateCode,
        verificationToken,
        issuedAt: new Date(),
        metadata: {
          courseTitle: course.title,
          completionDate: new Date().toISOString(),
        },
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    return certificate as unknown as CertificateDto;
  }

  async verifyCertificate(codeOrToken: string): Promise<CertificateVerificationDto> {
    const trimmed = codeOrToken.trim();

    const certificate = await this.prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateCode: trimmed },
          { verificationToken: trimmed },
        ],
      },
      include: {
        course: {
          select: {
            title: true,
            tools: true,
            instructor: { select: { fullName: true } },
          },
        },
        user: { select: { fullName: true } },
      },
    });

    if (!certificate) {
      throw new Error("Invalid or unverified certificate code");
    }

    return {
      isValid: true,
      certificateCode: certificate.certificateCode,
      recipientName: certificate.user.fullName,
      courseTitle: certificate.course.title,
      issuedAt: certificate.issuedAt,
      instructorName: certificate.course.instructor?.fullName ?? "",
      tools: certificate.course.tools ?? [],
    };
  }

  async getUserCertificates(userId: string): Promise<CertificateDto[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    return certificates as unknown as CertificateDto[];
  }

  async getCertificateById(
    certificateId: string,
    user?: AuthenticatedUser | null
  ): Promise<CertificateDto> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        course: { select: { id: true, title: true, slug: true, instructorId: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (user) {
      const isOwner = certificate.userId === user.id;
      const isAdmin = user.role === "ADMIN";
      const isInstructor =
        user.role === "INSTRUCTOR" && certificate.course.instructorId === user.id;

      if (!isOwner && !isAdmin && !isInstructor) {
        throw new Error("Forbidden: You cannot view this certificate directly");
      }
    }

    return certificate as unknown as CertificateDto;
  }
}

export const certificateService = new CertificateService();
