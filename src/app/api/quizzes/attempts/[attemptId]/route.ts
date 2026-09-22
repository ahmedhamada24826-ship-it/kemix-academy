import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { SubmitQuizAttemptSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ attemptId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { attemptId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const attempt = await quizService.getAttempt(attemptId, user);
    return apiSuccess({ attempt }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get attempt";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { attemptId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = SubmitQuizAttemptSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid attempt submission answers",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const attempt = await quizService.submitAttempt(attemptId, user, parseResult.data);
    return apiSuccess({ attempt }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit attempt";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden") || message.includes("already been submitted")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
