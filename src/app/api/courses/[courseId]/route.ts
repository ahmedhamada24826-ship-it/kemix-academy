import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { courseService } from "@/server/application/courses/course.service";
import { UpdateCourseSchema } from "@/server/domain/courses/course-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    const course = await courseService.getCourseById(courseId, user);
    return apiSuccess({ course }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get course";
    if (message.includes("not found") || message.includes("access denied")) {
      return apiError("NOT_FOUND", "Course not found", 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateCourseSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid course update input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const course = await courseService.updateCourse(courseId, user, parseResult.data);
    return apiSuccess({ course }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update course";
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
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await courseService.deleteCourse(courseId, user);
    return apiSuccess({ message: "Course deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete course";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
