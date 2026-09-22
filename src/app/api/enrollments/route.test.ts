import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { enrollmentService } from "@/server/application/enrollments/enrollment.service";
import * as authGuard from "@/server/application/auth/auth-guard";

vi.mock("@/server/application/enrollments/enrollment.service", () => ({
  enrollmentService: {
    listUserEnrollments: vi.fn(),
    listAllEnrollments: vi.fn(),
    selfEnroll: vi.fn(),
    adminAssign: vi.fn(),
  },
}));

describe("API /api/enrollments", () => {
  const studentUser = {
    id: "student-1",
    email: "student@kemix.com",
    fullName: "Student One",
    role: "STUDENT" as const,
    status: "ACTIVE" as const,
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/enrollments");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns user enrollments for authenticated student", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(studentUser);
      vi.mocked(enrollmentService.listUserEnrollments).mockResolvedValue({
        enrollments: [
          {
            id: "enr-1",
            userId: studentUser.id,
            courseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            status: "ACTIVE",
            enrollmentType: "FREE_ENROLLMENT",
            enrolledAt: new Date(),
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      });

      const req = new NextRequest("http://localhost:3000/api/enrollments");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.enrollments).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("self-enrolls a student into a course", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(studentUser);
      vi.mocked(enrollmentService.selfEnroll).mockResolvedValue({
        id: "enr-1",
        userId: studentUser.id,
        courseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        status: "ACTIVE",
        enrollmentType: "FREE_ENROLLMENT",
        enrolledAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          courseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data.enrollment.status).toBe("ACTIVE");
    });
  });
});
