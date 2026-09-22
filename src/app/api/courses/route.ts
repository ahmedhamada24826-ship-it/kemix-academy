import { NextRequest } from "next/server";
import { getCurrentUser, requireRole } from "@/server/application/auth/auth-guard";
import { courseService } from "@/server/application/courses/course.service";
import {
  CreateCourseSchema,
  CourseQuerySchema,
} from "@/server/domain/courses/course-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parseResult = CourseQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return apiError(
        "INVALID_QUERY",
        "Invalid course query parameters",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const result = await courseService.listCourses(parseResult.data, user);
    return apiSuccess(result, 200);
  } catch (err) {
    console.error("❌ /api/courses GET failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve courses", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    try {
      requireRole(["ADMIN", "INSTRUCTOR"], user);
    } catch {
      return apiError("FORBIDDEN", "Only instructors and admins can create courses", 403);
    }

    const body = await req.json();
    const parseResult = CreateCourseSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid course input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const course = await courseService.createCourse(user.id, parseResult.data);
    return apiSuccess({ course }, 201);
  } catch (err) {
    console.error("❌ /api/courses POST failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "Failed to create course", 500);
  }
}
