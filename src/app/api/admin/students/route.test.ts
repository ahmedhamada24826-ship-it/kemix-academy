import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import * as authGuard from "@/server/application/auth/auth-guard";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      findMany: vi.fn(),
    },
    lessonProgress: {
      count: vi.fn(),
    },
    lesson: {
      count: vi.fn(),
    },
    quizAttempt: {
      findMany: vi.fn(),
    },
    taskSubmission: {
      count: vi.fn(),
    },
    certificate: {
      findUnique: vi.fn(),
    },
  },
}));

describe("API /api/admin/students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns normalized student data compatible with the admin dashboard", async () => {
    vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue({
      id: "admin-1",
      email: "admin@kemix.academy",
      fullName: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
    });

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue([
      {
        id: "enr-1",
        userId: "user-1",
        courseId: "course-1",
        status: "ACTIVE",
        enrollmentType: "SELF",
        enrolledAt: new Date("2026-01-10T00:00:00.000Z"),
        createdAt: new Date("2026-01-10T00:00:00.000Z"),
        updatedAt: new Date("2026-01-10T00:00:00.000Z"),
        user: {
          id: "user-1",
          fullName: "Ahmad Ali",
          email: "ahmad@kemix.academy",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: new Date("2025-12-01T00:00:00.000Z"),
        },
        course: {
          id: "course-1",
          title: "AI for Beginners",
          slug: "ai-for-beginners",
          _count: { sections: 4 },
        },
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.enrollment.findMany>>);

    vi.mocked(prisma.lessonProgress.count).mockResolvedValue(2);
    vi.mocked(prisma.lesson.count).mockResolvedValue(4);
    vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([]);
    vi.mocked(prisma.taskSubmission.count).mockResolvedValue(1);
    vi.mocked(prisma.certificate.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/admin/students");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.students).toHaveLength(1);
    expect(data.data.students[0]).toMatchObject({
      id: "user-1",
      fullName: "Ahmad Ali",
      email: "ahmad@kemix.academy",
      courseId: "course-1",
      courseTitle: "AI for Beginners",
      enrollmentStatus: "ACTIVE",
    });
  });
});
