import { describe, it, expect, vi, beforeEach } from "vitest";
import { CertificateService } from "./certificate.service";
import { ProgressService } from "../progress/progress.service";
import { PrismaClient } from "@prisma/client";

describe("CertificateService", () => {
  let mockPrisma: {
    course: { findUnique: ReturnType<typeof vi.fn> };
    enrollment: { findUnique: ReturnType<typeof vi.fn> };
    certificate: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let mockProgressService: { calculateCourseCompletion: ReturnType<typeof vi.fn> };
  let certService: CertificateService;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      enrollment: {
        findUnique: vi.fn(),
      },
      certificate: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };

    mockProgressService = {
      calculateCourseCompletion: vi.fn(),
    };

    certService = new CertificateService(
      mockPrisma as unknown as PrismaClient,
      mockProgressService as unknown as ProgressService
    );
  });

  describe("claimCertificate", () => {
    it("issues certificate when completion is 100%", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        title: "Python for Data Analysis",
        slug: "python-for-data-analysis",
        status: "PUBLISHED",
        certificatesEnabled: true,
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enr-1",
        status: "ACTIVE",
      });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockProgressService.calculateCourseCompletion.mockResolvedValue({
        totalLessons: 10,
        completedLessons: 10,
        percentage: 100,
        isCompleted: true,
      });
      mockPrisma.certificate.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "cert-1",
          ...data,
          course: { id: "course-1", title: "Python for Data Analysis", slug: "python-for-data-analysis" },
          user: { id: "user-1", fullName: "Jane Doe" },
        })
      );

      const cert = await certService.claimCertificate("user-1", "course-1");
      expect(cert.id).toBe("cert-1");
      expect(cert.certificateCode).toContain("KEMIX-");
      expect(cert.verificationToken).toBeDefined();
    });

    it("rejects claim if course completion requirements are not met", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        title: "Python for Data Analysis",
        status: "PUBLISHED",
        certificatesEnabled: true,
      });
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: "enr-1",
        status: "ACTIVE",
      });
      mockPrisma.certificate.findUnique.mockResolvedValue(null);
      mockProgressService.calculateCourseCompletion.mockResolvedValue({
        totalLessons: 10,
        completedLessons: 6,
        percentage: 60,
        isCompleted: false,
      });

      await expect(
        certService.claimCertificate("user-1", "course-1")
      ).rejects.toThrow("Course requirements not met: 6/10");
    });

    it("rejects claims when certificate issuance is disabled", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        title: "Python for Data Analysis",
        status: "PUBLISHED",
        certificatesEnabled: false,
      });

      await expect(
        certService.claimCertificate("user-1", "course-1")
      ).rejects.toThrow("Certificate issuance is not enabled for this course");
    });
  });

  describe("verifyCertificate", () => {
    it("validates certificate code and returns non-sensitive metadata", async () => {
      const issuedAt = new Date();
      mockPrisma.certificate.findFirst.mockResolvedValue({
        id: "cert-1",
        certificateCode: "KEMIX-TEST-1234",
        issuedAt,
        user: { fullName: "Jane Doe" },
        course: { title: "Data Science Foundations" },
      });

      const result = await certService.verifyCertificate("KEMIX-TEST-1234");
      expect(result.isValid).toBe(true);
      expect(result.certificateCode).toBe("KEMIX-TEST-1234");
      expect(result.recipientName).toBe("Jane Doe");
      expect(result.courseTitle).toBe("Data Science Foundations");
    });

    it("throws not found on invalid code", async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(null);

      await expect(
        certService.verifyCertificate("INVALID-CODE")
      ).rejects.toThrow("Invalid or unverified certificate code");
    });
  });
});
