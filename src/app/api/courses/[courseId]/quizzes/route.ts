import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
import { CreateQuizSchema } from "@/server/domain/quizzes/quiz-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";
import { prisma } from "@/lib/prisma";

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
        ...(user && (user.role === "ADMIN" || user.role === "INSTRUCTOR")
          ? {}
          : { isPublished: true }),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        courseId: true,
        lessonId: true,
        title: true,
        description: true,
        passingScore: true,
        timeLimitMinutes: true,
        maxAttempts: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ quizzes }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list quizzes";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = CreateQuizSchema.safeParse({ ...body, courseId });

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid quiz input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const quiz = await quizService.createQuiz(user, parseResult.data);
    return apiSuccess({ quiz }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create quiz";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
