import { NextRequest } from "next/server";
import { getCurrentUser, extractTokenFromCookieHeader } from "@/server/application/auth/auth-guard";
import { getExpiredSessionCookieOptions } from "@/config/session";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const rawToken = extractTokenFromCookieHeader(req.headers.get("cookie"));

    if (!rawToken) {
      return apiError("UNAUTHENTICATED", "Not authenticated", 401);
    }

    const user = await getCurrentUser(rawToken);

    if (!user) {
      // Clear stale/expired cookie if resolution fails
      const isSecure =
        process.env.COOKIE_SECURE === "true" ||
        process.env.NODE_ENV === "production";

      const expiredCookie = getExpiredSessionCookieOptions(isSecure);
      return apiError("UNAUTHENTICATED", "Session expired or invalid", 401, undefined, expiredCookie);
    }

    return apiSuccess({ user }, 200);
  } catch (err) {
    console.error("❌ Unexpected /api/auth/me failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
