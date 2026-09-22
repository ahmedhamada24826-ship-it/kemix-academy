import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { UpdateQuizSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ quizId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    const quiz = await quizService.getQuizById(quizId, user);
    return apiSuccess({ quiz }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get quiz";
    if (message.includes("not found") || message.includes("unpublished")) {
      return apiError("NOT_FOUND", "Quiz not found", 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateQuizSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid quiz update input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const quiz = await quizService.updateQuiz(quizId, user, parseResult.data);
    return apiSuccess({ quiz }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update quiz";
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
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await quizService.deleteQuiz(quizId, user);
    return apiSuccess({ message: "Quiz deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete quiz";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
