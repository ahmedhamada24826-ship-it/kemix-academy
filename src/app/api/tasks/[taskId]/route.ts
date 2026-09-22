import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { taskService } from "@/server/application/tasks/task.service";
import { UpdateTaskSchema } from "@/server/domain/tasks/task-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const user = await getCurrentUser(req);
    const task = await taskService.getTaskById(taskId, user);
    return apiSuccess({ task });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch task";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_FETCH_ERROR", message, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validation = UpdateTaskSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid input data",
        422,
        validation.error.flatten()
      );
    }

    const task = await taskService.updateTask(taskId, user, validation.data);
    return apiSuccess({ task });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_UPDATE_ERROR", message, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    await taskService.deleteTask(taskId, user);
    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_DELETE_ERROR", message, status);
  }
}
