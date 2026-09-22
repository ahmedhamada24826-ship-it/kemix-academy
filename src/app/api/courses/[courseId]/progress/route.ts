import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { progressService } from "@/server/application/progress/progress.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const targetUserId = req.nextUrl.searchParams.get("userId") || user.id;

    const dto = await progressService.getCourseProgress(
      targetUserId,
      courseId,
      user
    );

    // Derive lastAccessedLessonId from the most recently updated lesson progress
    const lastAccessedLesson = dto.lessonProgressList.length > 0
      ? dto.lessonProgressList.reduce((latest, lp) =>
          new Date(lp.updatedAt) > new Date(latest.updatedAt) ? lp : latest
        )
      : null;

    // Normalize DTO field names to match the frontend ProgressData interface
    const progress = {
      courseId: dto.courseId,
      totalLessons: dto.totalLessons,
      completedLessons: dto.completedLessons,
      progressPercent: dto.completionPercentage,
      isCompleted: dto.isCompleted,
      lastAccessedLessonId: lastAccessedLesson?.lessonId ?? null,
      lessonProgresses: dto.lessonProgressList.map((lp) => ({
        lessonId: lp.lessonId,
        completed: lp.completed,
        progressPercent: lp.progressPercent,
        lastPositionSeconds: lp.lastPositionSeconds,
      })),
    };

    return apiSuccess({ progress }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrieve progress";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

