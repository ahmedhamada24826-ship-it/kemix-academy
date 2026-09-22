import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { CreateQuizQuestionSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ quizId: string }>;
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = CreateQuizQuestionSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid question input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const question = await quizService.addQuestion(quizId, user, parseResult.data);
    return apiSuccess({ question }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add question";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
