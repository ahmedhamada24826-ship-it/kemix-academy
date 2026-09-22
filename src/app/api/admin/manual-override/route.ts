import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { ManualOverrideSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Forbidden: Only administrators can execute manual overrides", 403);
    }

    const body = await req.json();
    const validation = ManualOverrideSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid override input",
        422,
        validation.error.flatten()
      );
    }

    const result = await quizService.manualOverride(user, validation.data);
    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Manual override failed";
    const status = message.includes("not found") ? 404 : 400;
    return apiError("MANUAL_OVERRIDE_ERROR", message, status);
  }
}
