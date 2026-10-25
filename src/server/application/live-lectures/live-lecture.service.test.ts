import { describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { LiveLectureService } from "./live-lecture.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

describe("LiveLectureService", () => {
  it("allows admins to view any scheduled lecture", async () => {
    const prisma = {
      liveLecture: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      course: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      enrollment: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const service = new LiveLectureService(prisma as unknown as PrismaClient);
    const adminUser: AuthenticatedUser = {
      id: "admin-1",
      email: "admin@kemix.academy",
      fullName: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date(),
    };

    const result = await service.listLecturesForUser(adminUser);
    expect(result).toEqual([]);
    expect(prisma.liveLecture.findMany).toHaveBeenCalled();
  });

  it("allows enrolled students to list lectures for an accessible course", async () => {
    const prisma = {
      liveLecture: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "lecture-1",
            title: "Live Session",
            courseId: "course-1",
            instructorId: "instructor-1",
            scheduledAt: new Date("2026-11-02T19:00:00Z"),
            durationMinutes: 60,
            status: "LIVE",
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            course: { id: "course-1", title: "Data Analysis", slug: "data-analysis", status: "PUBLISHED" },
            instructor: { id: "instructor-1", fullName: "Ahmed Hamada", email: "ahmed@kemix.academy" },
          },
        ]),
      },
      enrollment: {
        findUnique: vi.fn().mockResolvedValue({ status: "ACTIVE" }),
      },
    };

    const service = new LiveLectureService(prisma as unknown as PrismaClient);
    const studentUser: AuthenticatedUser = {
      id: "student-1",
      email: "student@kemix.academy",
      fullName: "Student User",
      role: "STUDENT",
      status: "ACTIVE",
      createdAt: new Date(),
    };

    const result = await service.listLecturesForUser(studentUser, "course-1");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Live Session");
  });
});
