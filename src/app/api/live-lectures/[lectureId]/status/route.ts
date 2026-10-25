import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { liveLectureService } from "@/server/application/live-lectures/live-lecture.service";
import { apiError, apiSuccess } from "@/server/infrastructure/http/api-response";

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

    return apiSuccess({ lecture, status: lecture.status }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load lecture status";
    return apiError("LIVE_LECTURE_STATUS_ERROR", message, 500);
  }
}
