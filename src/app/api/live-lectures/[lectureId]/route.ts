import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { liveLectureService } from "@/server/application/live-lectures/live-lecture.service";
import { apiError, apiSuccess } from "@/server/infrastructure/http/api-response";

const UpdateLiveLectureSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  courseId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["SCHEDULED", "READY", "LIVE", "PROCESSING", "RECORDED", "FAILED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ lectureId: string }> }) {
  try {
    const { lectureId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const lecture = await liveLectureService.getLectureById(lectureId, user);
    if (!lecture) {
      return apiError("NOT_FOUND", "Live lecture not found", 404);
    }

    return apiSuccess({ lecture }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch live lecture";
    return apiError("LIVE_LECTURE_FETCH_ERROR", message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ lectureId: string }> }) {
  try {
    const { lectureId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateLiveLectureSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid live lecture update payload",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const lecture = await liveLectureService.updateLecture(lectureId, user, parseResult.data);
    return apiSuccess({ lecture }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update live lecture";
    return apiError("LIVE_LECTURE_UPDATE_ERROR", message, 500);
  }
}
