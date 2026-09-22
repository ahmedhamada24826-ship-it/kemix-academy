import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { auditLogService } from "@/server/application/audit/audit.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Forbidden: Only administrators can view audit logs", 403);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 30;

    const result = await auditLogService.listLogs({
      action,
      entity,
      actorId,
      page,
      limit,
    });

    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs";
    return apiError("AUDIT_LOGS_FETCH_ERROR", message, 400);
  }
}
