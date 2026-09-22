import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { courseService } from "@/server/application/courses/course.service";
import * as authGuard from "@/server/application/auth/auth-guard";

vi.mock("@/server/application/courses/course.service", () => ({
  courseService: {
    listCourses: vi.fn(),
    createCourse: vi.fn(),
  },
}));

describe("API /api/courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns course listing with 200 OK", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(null);
      vi.mocked(courseService.listCourses).mockResolvedValue({
        courses: [
          {
            id: "course-1",
            title: "Data Analysis with Python",
            slug: "data-analysis-with-python",
            shortDescription: null,
            description: "Sample description",
            coverImageUrl: null,
            price: 0,
            currency: "EGP",
            isFree: true,
            certificatesEnabled: false,
            status: "PUBLISHED",
            level: "BEGINNER",
            tools: [],
        requirements: null,
            whatYouWillLearn: [],
            instructorId: "inst-1",
            durationSeconds: 3600,
            sortOrder: 0,
            isArchived: false,
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const req = new NextRequest("http://localhost:3000/api/courses?page=1&limit=20");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.courses).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "New Course",
          description: "A comprehensive description",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 if user is STUDENT", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue({
        id: "student-1",
        email: "student@kemix.com",
        fullName: "Student",
        role: "STUDENT",
        status: "ACTIVE",
        avatarUrl: null,
        bio: null,
        createdAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "New Course",
          description: "A comprehensive description",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("creates course when authorized instructor", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue({
        id: "inst-1",
        email: "inst@kemix.com",
        fullName: "Instructor",
        role: "INSTRUCTOR",
        status: "ACTIVE",
        avatarUrl: null,
        bio: null,
        createdAt: new Date(),
      });

      vi.mocked(courseService.createCourse).mockResolvedValue({
        id: "course-new",
        title: "Advanced SQL",
        slug: "advanced-sql",
        shortDescription: null,
        description: "Comprehensive guide to SQL queries and performance tuning.",
        coverImageUrl: null,
        price: 0,
        currency: "EGP",
        isFree: true,
            certificatesEnabled: false,
        status: "DRAFT",
        level: "ADVANCED",
        tools: [],
        requirements: null,
        whatYouWillLearn: [],
        instructorId: "inst-1",
        durationSeconds: 0,
        sortOrder: 0,
        isArchived: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Advanced SQL",
          description: "Comprehensive guide to SQL queries and performance tuning.",
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.course.title).toBe("Advanced SQL");
    });
  });
});
