import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { lessonService } from "@/server/application/lessons/lesson.service";
import * as authGuard from "@/server/application/auth/auth-guard";

vi.mock("@/server/application/lessons/lesson.service", () => ({
  lessonService: {
    createLesson: vi.fn(),
    reorderLessons: vi.fn(),
  },
}));

describe("API /api/sections/[sectionId]/lessons", () => {
  const instructorUser = {
    id: "inst-1",
    email: "inst@kemix.com",
    fullName: "Instructor",
    role: "INSTRUCTOR" as const,
    status: "ACTIVE" as const,
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/sections/sec-1/lessons", {
        method: "POST",
        body: JSON.stringify({ title: "Test Lesson" }),
      });

      const res = await POST(req, { params: Promise.resolve({ sectionId: "sec-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid payload - short title", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(instructorUser);

      const req = new NextRequest("http://localhost:3000/api/sections/sec-1/lessons", {
        method: "POST",
        body: JSON.stringify({ title: "A" }),
      });

      const res = await POST(req, { params: Promise.resolve({ sectionId: "sec-1" }) });
      expect(res.status).toBe(400);
    });

    it("creates lesson with English title and ASCII slug (frontend payload)", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(instructorUser);

      vi.mocked(lessonService.createLesson).mockResolvedValue({
        id: "lesson-1",
        sectionId: "sec-1",
        title: "Introduction to Pandas",
        slug: "introduction-to-pandas",
        description: null,
        lessonType: "VIDEO",
        videoSource: "YOUTUBE",
        videoProvider: null,
        videoUrl: null,
        unlockRule: "PREVIOUS_LESSON",
        content: null,
        storageKey: null,
        sortOrder: 10,
        isPublished: false,
        isFreePreview: false,
        isArchived: false,
        durationSeconds: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payload = {
        title: "Introduction to Pandas",
        slug: "introduction-to-pandas",
        lessonType: "VIDEO",
        videoSource: "YOUTUBE",
        videoUrl: undefined,
        unlockRule: "PREVIOUS_LESSON",
        durationSeconds: 600,
        isFreePreview: false,
        content: undefined,
        sortOrder: 10,
      };

      const req = new NextRequest("http://localhost:3000/api/sections/sec-1/lessons", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ sectionId: "sec-1" }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.lesson.title).toBe("Introduction to Pandas");
      expect(data.data.lesson.slug).toBe("introduction-to-pandas");
    });

    it("creates lesson with Arabic title and Arabic slug (frontend payload)", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(instructorUser);

      vi.mocked(lessonService.createLesson).mockResolvedValue({
        id: "lesson-2",
        sectionId: "sec-1",
        title: "درس اختبار",
        slug: "درس-اختبار",
        description: null,
        lessonType: "VIDEO",
        videoSource: "YOUTUBE",
        videoProvider: null,
        videoUrl: null,
        unlockRule: "PREVIOUS_LESSON",
        content: null,
        storageKey: null,
        sortOrder: 10,
        isPublished: false,
        isFreePreview: false,
        isArchived: false,
        durationSeconds: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const payload = {
        title: "درس اختبار",
        slug: "درس-اختبار",
        lessonType: "VIDEO",
        videoSource: "YOUTUBE",
        videoUrl: undefined,
        unlockRule: "PREVIOUS_LESSON",
        durationSeconds: 600,
        isFreePreview: false,
        content: undefined,
        sortOrder: 10,
      };

      const req = new NextRequest("http://localhost:3000/api/sections/sec-1/lessons", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: Promise.resolve({ sectionId: "sec-1" }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.lesson.title).toBe("درس اختبار");
      expect(data.data.lesson.slug).toBe("درس-اختبار");
    });

    it("accepts Unicode letters outside the legacy Arabic slug range", async () => {
      vi.spyOn(authGuard, "getCurrentUser").mockResolvedValue(instructorUser);
      vi.mocked(lessonService.createLesson).mockResolvedValue({
        id: "lesson-3",
        sectionId: "sec-1",
        title: "Python للمبتدئين",
        slug: "پایتون-1",
        description: null,
        lessonType: "VIDEO",
        videoSource: "YOUTUBE",
        videoProvider: null,
        videoUrl: null,
        unlockRule: "IMMEDIATE",
        content: null,
        storageKey: null,
        sortOrder: 10,
        isPublished: false,
        isFreePreview: false,
        isArchived: false,
        durationSeconds: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/sections/sec-1/lessons", {
        method: "POST",
        body: JSON.stringify({
          title: "Python للمبتدئين",
          slug: "پایتون-1",
          lessonType: "VIDEO",
          videoSource: "YOUTUBE",
          unlockRule: "IMMEDIATE",
          durationSeconds: 600,
          isFreePreview: false,
          sortOrder: 10,
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ sectionId: "sec-1" }) });

      expect(res.status).toBe(201);
    });
  });
});
