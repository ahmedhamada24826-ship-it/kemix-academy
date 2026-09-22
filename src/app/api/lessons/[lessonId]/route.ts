import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { lessonService } from "@/server/application/lessons/lesson.service";
import { UpdateLessonSchema } from "@/server/domain/lessons/lesson-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ lessonId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { lessonId } = await props.params;
    const user = await getCurrentUser(req);
    const lesson = await lessonService.getLessonById(lessonId, user);
    return apiSuccess({ lesson }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get lesson";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", "Lesson not found", 404);
    }
    if (message.includes("Access denied") || message.includes("Enrollment required") || message.includes("Authentication required")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { lessonId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateLessonSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid lesson update input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const lesson = await lessonService.updateLesson(lessonId, user, parseResult.data);
    return apiSuccess({ lesson }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update lesson";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { lessonId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await lessonService.deleteLesson(lessonId, user);
    return apiSuccess({ message: "Lesson deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete lesson";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
