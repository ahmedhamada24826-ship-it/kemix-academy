import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { liveLectureService } from "@/server/application/live-lectures/live-lecture.service";
import { apiError, apiSuccess } from "@/server/infrastructure/http/api-response";

const CreateLiveLectureSchema = z.object({
  title: z.string().trim().min(3).max(180),
  courseId: z.string().uuid(),
  instructorId: z.string().uuid(),
  scheduledAt: z.string().datetime().or(z.string().min(1)),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["SCHEDULED", "READY", "LIVE", "PROCESSING", "RECORDED", "FAILED"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (user.role === "STUDENT") {
      const courseId = req.nextUrl.searchParams.get("courseId");
      if (!courseId) {
        return apiError("FORBIDDEN", "Students must request lectures for a specific course", 403);
      }
    }

    const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined;
    const lectures = await liveLectureService.listLecturesForUser(user, courseId);
    return apiSuccess({ lectures }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load live lectures";
    return apiError("LIVE_LECTURE_QUERY_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Only administrators can create live lectures", 403);
    }

    const body = await req.json();
    const parseResult = CreateLiveLectureSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid live lecture payload",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const lecture = await liveLectureService.createLecture(user, parseResult.data);
    return apiSuccess({ lecture }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create live lecture";
    return apiError("LIVE_LECTURE_CREATE_ERROR", message, 500);
  }
}
