import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { lessonService } from "@/server/application/lessons/lesson.service";
import {
  CreateLessonSchema,
  ReorderLessonsSchema,
} from "@/server/domain/lessons/lesson-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ sectionId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { sectionId } = await props.params;
    const user = await getCurrentUser(req);
    const lessons = await lessonService.listLessonsBySection(sectionId, user);
    return apiSuccess({ lessons }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list lessons";
    if (message.includes("not found") || message.includes("access denied")) {
      return apiError("NOT_FOUND", "Section or course not found", 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { sectionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = CreateLessonSchema.safeParse(body);

    if (!parseResult.success) {
      const validationDetails = parseResult.error.flatten();
      return apiError(
        "VALIDATION_ERROR",
        "Invalid lesson input",
        400,
        process.env.NODE_ENV === "development"
          ? { ...validationDetails, issues: parseResult.error.issues }
          : validationDetails.fieldErrors
      );
    }

    const lesson = await lessonService.createLesson(sectionId, user, parseResult.data);
    return apiSuccess({ lesson }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create lesson";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function PUT(req: NextRequest, props: RouteProps) {
  try {
    const { sectionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = ReorderLessonsSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid lesson reorder input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const lessons = await lessonService.reorderLessons(sectionId, user, parseResult.data);
    return apiSuccess({ lessons }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reorder lessons";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
