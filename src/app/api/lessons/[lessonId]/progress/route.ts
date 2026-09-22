import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { progressService } from "@/server/application/progress/progress.service";
import { UpdateLessonProgressSchema } from "@/server/domain/progress/progress-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ lessonId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { lessonId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const unlockStatus = await progressService.checkLessonUnlockStatus(user.id, lessonId);
    return apiSuccess({ unlockStatus }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch progress";
    return apiError("PROGRESS_FETCH_ERROR", message, 400);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { lessonId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateLessonProgressSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid lesson progress input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const progress = await progressService.updateLessonProgress(
      user.id,
      lessonId,
      parseResult.data
    );

    return apiSuccess({ progress }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update progress";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden") || message.includes("enrolled")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

