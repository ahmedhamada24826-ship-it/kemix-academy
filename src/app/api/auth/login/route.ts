import { NextRequest } from "next/server";
import { loginRequestSchema } from "@/server/domain/auth/auth-schemas";
import {
  authService,
  AuthenticationError,
  AccountInactiveError,
} from "@/server/application/auth/auth.service";
import { rateLimiter } from "@/server/infrastructure/security/memory-rate-limiter";
import { RATE_LIMIT_CONFIG } from "@/config/rate-limit";
import { getSessionCookieOptions } from "@/config/session";
import { validateSameOrigin } from "@/server/infrastructure/security/csrf-protection";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    // 1. Defense-in-depth CSRF same-origin check for browser clients
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if ((origin || referer) && !validateSameOrigin(origin, referer)) {
      return apiError("FORBIDDEN", "Cross-origin requests forbidden", 403);
    }

    // 2. Parse request JSON body safely
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("INVALID_JSON", "Invalid JSON request body", 400);
    }

    // 3. Validate input payload against Zod schema
    const parseResult = loginRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid request parameters",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const { email, password, rememberMe } = parseResult.data;

    // 4. Rate limiting by IP + email key
    const clientIp = getClientIp(req);
    const rateLimitKey = `login:${clientIp}:${email}`;
    const rateLimit = await rateLimiter.consume(
      rateLimitKey,
      RATE_LIMIT_CONFIG.LOGIN.MAX_ATTEMPTS,
      RATE_LIMIT_CONFIG.LOGIN.WINDOW_SECONDS
    );

    if (!rateLimit.allowed) {
      const response = apiError(
        "TOO_MANY_REQUESTS",
        "Too many login attempts. Please try again later.",
        429,
        { retryAfterSeconds: rateLimit.retryAfterSeconds }
      );
      if (rateLimit.retryAfterSeconds) {
        response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      }
      return response;
    }

    // 5. Authenticate user via application service
    let authResult;
    try {
      authResult = await authService.authenticateUser({
        email,
        password,
        rememberMe,
      });
    } catch (err) {
      if (err instanceof AuthenticationError || err instanceof AccountInactiveError) {
        // Safe generic error to prevent account enumeration
        return apiError("UNAUTHORIZED", "Invalid email or password", 401);
      }
      throw err;
    }

    // 6. Reset rate limit counter upon successful authentication
    await rateLimiter.reset(rateLimitKey);

    // 7. Generate cookie options and return safe authenticated user
    const isSecure =
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production";

    const cookieOptions = getSessionCookieOptions(
      authResult.sessionToken,
      authResult.expiresAt,
      isSecure
    );

    return apiSuccess({ user: authResult.user }, 200, cookieOptions);
  } catch (err) {
    console.error("❌ Unexpected login failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
