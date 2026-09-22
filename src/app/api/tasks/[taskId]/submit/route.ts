import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { taskService } from "@/server/application/tasks/task.service";
import { SubmitTaskSchema } from "@/server/domain/tasks/task-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function POST(
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
    const validation = SubmitTaskSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid submission data",
        422,
        validation.error.flatten()
      );
    }

    const submission = await taskService.submitTask(taskId, user, validation.data);
    return apiSuccess({ submission }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit task";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_SUBMIT_ERROR", message, status);
  }
}
