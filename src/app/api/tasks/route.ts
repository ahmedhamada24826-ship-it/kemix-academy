import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { taskService } from "@/server/application/tasks/task.service";
import { CreateTaskSchema } from "@/server/domain/tasks/task-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const courseId = searchParams.get("courseId");

    if (lessonId) {
      const tasks = await taskService.listTasksByLesson(lessonId, user);
      return apiSuccess({ tasks });
    }

    if (courseId) {
      if (!user) {
        return apiError("UNAUTHORIZED", "Authentication required", 401);
      }
      const tasks = await taskService.listTasksByCourse(courseId, user);
      return apiSuccess({ tasks });
    }

    return apiError("BAD_REQUEST", "Please provide either lessonId or courseId", 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tasks";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_FETCH_ERROR", message, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validation = CreateTaskSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid input data",
        422,
        validation.error.flatten()
      );
    }

    const task = await taskService.createTask(user, validation.data);
    return apiSuccess({ task }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_CREATE_ERROR", message, status);
  }
}
