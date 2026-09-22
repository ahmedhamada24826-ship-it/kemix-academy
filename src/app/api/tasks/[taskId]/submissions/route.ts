import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { taskService } from "@/server/application/tasks/task.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const submissions = await taskService.listSubmissions(taskId, user);
    return apiSuccess({ submissions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch submissions";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("TASK_SUBMISSIONS_FETCH_ERROR", message, status);
  }
}
