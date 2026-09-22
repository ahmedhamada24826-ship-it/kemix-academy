import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ quizId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const targetUserId = req.nextUrl.searchParams.get("userId") || user.id;
    const attempts = await quizService.listUserAttempts(quizId, targetUserId, user);
    return apiSuccess({ attempts }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list attempts";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { quizId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const attempt = await quizService.startAttempt(quizId, user);
    return apiSuccess({ attempt }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start quiz attempt";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (
      message.includes("Forbidden") ||
      message.includes("enrolled") ||
      message.includes("published") ||
      message.includes("Maximum attempts")
    ) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
