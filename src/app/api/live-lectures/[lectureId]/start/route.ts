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
      return apiError("FORBIDDEN", "Only instructors and admins can start a live lecture", 403);
    }

    if (!youtubeLiveService.hasCredentials()) {
      return apiError(
        "YOUTUBE_LIVE_NOT_CONFIGURED",
        "YouTube Live credentials are not configured on the server. Set the YOUTUBE_* values before starting a live lecture.",
        500
      );
    }

    const lectureBeforeStart = await liveLectureService.getLectureById(lectureId, user);
    if (!lectureBeforeStart) {
      return apiError("LIVE_LECTURE_NOT_FOUND", "Live lecture not found or access denied", 404);
    }

    const broadcastSession = await youtubeLiveService.createBroadcastSession({
      id: lectureBeforeStart.id,
      title: lectureBeforeStart.title,
      scheduledAt: lectureBeforeStart.scheduledAt,
      description: lectureBeforeStart.description,
    });

    const lecture = await liveLectureService.startLecture(lectureId, user);
    const lectureWithYouTube = await liveLectureService.updateLecture(lectureId, user, {
      status: lecture.status,
      startedAt: lecture.startedAt,
      youtubeBroadcastId: broadcastSession.broadcastId,
      youtubeUrl: broadcastSession.youtubeUrl ?? lecture.youtubeUrl ?? null,
      youtubeEmbedUrl: broadcastSession.youtubeEmbedUrl ?? lecture.youtubeEmbedUrl ?? null,
    });

    const gatewayUrl =
      process.env.NEXT_PUBLIC_LIVE_STREAM_GATEWAY_URL ||
      process.env.LIVE_STREAMING_GATEWAY_URL ||
      "http://localhost:8555";

    return apiSuccess(
      {
        lecture: lectureWithYouTube,
        ingest: {
          endpoint: `${gatewayUrl}/whip`,
          ingestUrl: broadcastSession.ingestUrl,
          streamName: broadcastSession.streamName,
          streamKey: broadcastSession.streamKey,
          broadcastId: broadcastSession.broadcastId,
        },
      },
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start live lecture";
    return apiError("LIVE_LECTURE_START_ERROR", message, 500);
  }
}
