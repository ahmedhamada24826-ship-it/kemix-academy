import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { fileService } from "@/server/application/files/file.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

/**
 * GET /api/files — list media assets for the current user.
 * Instructors see their own uploads; admins see everything.
 * Optional filters: ?search= &category=
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const category = req.nextUrl.searchParams.get("category") || undefined;

    const assets = await fileService.listFileAssets(user, { search, category });
    return apiSuccess({ files: assets }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list media assets";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}