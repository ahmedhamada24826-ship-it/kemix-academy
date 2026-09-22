import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { UpdateQuizQuestionSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ questionId: string }>;
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { questionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

    const validation = UpdateQuizQuestionSchema.safeParse(await req.json());
    if (!validation.success) {
      return apiError("VALIDATION_ERROR", "Invalid question update input", 400, validation.error.flatten().fieldErrors);
    }

    const question = await quizService.updateQuestion(questionId, user, validation.data);
    return apiSuccess({ question }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update question";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return apiError("QUIZ_QUESTION_UPDATE_ERROR", message, status);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { questionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

    await quizService.deleteQuestion(questionId, user);
    return apiSuccess({ message: "Quiz question deleted successfully" }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete question";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return apiError("QUIZ_QUESTION_DELETE_ERROR", message, status);
  }
}