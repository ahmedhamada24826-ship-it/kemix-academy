import { NextRequest } from "next/server";
import { authService } from "@/server/application/auth/auth.service";
import { extractTokenFromCookieHeader } from "@/server/application/auth/auth-guard";
import { getExpiredSessionCookieOptions } from "@/config/session";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";
import { validateSameOrigin } from "@/server/infrastructure/security/csrf-protection";

export async function POST(req: NextRequest) {
  try {
    // 1. Same-origin CSRF check
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if ((origin || referer) && !validateSameOrigin(origin, referer)) {
      return apiError("FORBIDDEN", "Cross-origin requests forbidden", 403);
    }

    // 2. Extract session token from Cookie header
    const token = extractTokenFromCookieHeader(req.headers.get("cookie"));

    // 3. Invalidate session if present (safe and idempotent)
    if (token) {
      await authService.invalidateSession(token);
    }

    // 4. Generate expired cookie options to clear client-side cookie
    const isSecure =
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production";

    const expiredCookieOptions = getExpiredSessionCookieOptions(isSecure);

    return apiSuccess({ success: true }, 200, expiredCookieOptions);
  } catch (err) {
    console.error("❌ Unexpected logout failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
