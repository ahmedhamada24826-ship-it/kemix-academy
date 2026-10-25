import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { liveLectureService } from "@/server/application/live-lectures/live-lecture.service";
import { youtubeLiveService } from "@/server/application/youtube/youtube-live.service";
import { apiError, apiSuccess } from "@/server/infrastructure/http/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ lectureId: string }> }) {
  try {
    const { lectureId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      return apiError("FORBIDDEN", "Only instructors and admins can end a live lecture", 403);
    }

    const lecture = await liveLectureService.getLectureById(lectureId, user);
    if (!lecture) {
      return apiError("LIVE_LECTURE_NOT_FOUND", "Live lecture not found or access denied", 404);
    }

    if (lecture.youtubeBroadcastId && youtubeLiveService.hasCredentials()) {
      await youtubeLiveService.endBroadcast(lecture.youtubeBroadcastId);
    }

    const endedLecture = await liveLectureService.endLecture(lectureId, user);
    return apiSuccess({ lecture: endedLecture }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end the live lecture";
    return apiError("LIVE_LECTURE_END_ERROR", message, 500);
  }
}
