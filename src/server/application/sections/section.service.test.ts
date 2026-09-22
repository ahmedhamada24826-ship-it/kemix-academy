import { describe, it, expect, vi, beforeEach } from "vitest";
import { SectionService } from "./section.service";
import { CourseAccessService } from "../courses/course-access.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { PrismaClient } from "@prisma/client";

describe("SectionService", () => {
  let mockPrisma: {
    course: { findUnique: ReturnType<typeof vi.fn> };
    courseSection: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockAccessService: { canManageCourse: ReturnType<typeof vi.fn> };
  let sectionService: SectionService;

  const instructorUser: AuthenticatedUser = {
    id: "inst-1",
    email: "inst@kemix.com",
    fullName: "Instructor 1",
    role: "INSTRUCTOR",
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
      courseSection: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
    };

    mockAccessService = {
      canManageCourse: vi.fn((user, course) => course.instructorId === user.id),
    };

    sectionService = new SectionService(
      mockPrisma as unknown as PrismaClient,
      mockAccessService as unknown as CourseAccessService
    );
  });

  describe("createSection", () => {
    it("creates section with incremental sortOrder", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: "inst-1",
      });
      mockPrisma.courseSection.findFirst.mockResolvedValue({ sortOrder: 2 });
      mockPrisma.courseSection.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "section-1", ...data })
      );

      const section = await sectionService.createSection("course-1", instructorUser, {
        title: "Module 1: Foundations",
      });

      expect(section.sortOrder).toBe(3);
      expect(section.title).toBe("Module 1: Foundations");
    });
  });

  describe("reorderSections", () => {
    it("executes reorder in transaction", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        instructorId: "inst-1",
      });
      mockPrisma.courseSection.update.mockResolvedValue({});
      mockPrisma.courseSection.findMany.mockResolvedValue([
        { id: "sec-2", sortOrder: 0 },
        { id: "sec-1", sortOrder: 1 },
      ]);

      const result = await sectionService.reorderSections("course-1", instructorUser, {
        sectionOrders: [
          { id: "sec-2", sortOrder: 0 },
          { id: "sec-1", sortOrder: 1 },
        ],
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
