import { NextRequest } from "next/server";
import { registerRequestSchema } from "@/server/domain/auth/auth-schemas";
import {
  authService,
  EmailAlreadyRegisteredError,
  RegistrationPasswordPolicyError,
} from "@/server/application/auth/auth.service";
import { platformSettingsService } from "@/server/application/settings/settings.service";
import { rateLimiter } from "@/server/infrastructure/security/memory-rate-limiter";
import { RATE_LIMIT_CONFIG } from "@/config/rate-limit";
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

    // 3. Validate input payload against Zod registration schema
    const parseResult = registerRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid request parameters",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const { email, password, fullName } = parseResult.data;

    // 4. Platform-wide registration policy (PlatformSettings.allowRegistration)
    const settings = await platformSettingsService.getSettings();
    if (!settings.allowRegistration) {
      return apiError(
        "REGISTRATION_DISABLED",
        "التسجيل في المنصة متوقف حاليًا. يرجى التواصل مع الدعم الفني لإنشاء حساب.",
        403
      );
    }

    // 5. IP-based rate limiting: 3 registration attempts per hour per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `register:${clientIp}`;
    const rateLimit = await rateLimiter.consume(
      rateLimitKey,
      RATE_LIMIT_CONFIG.REGISTER.MAX_ATTEMPTS,
      RATE_LIMIT_CONFIG.REGISTER.WINDOW_SECONDS
    );

    if (!rateLimit.allowed) {
      const response = apiError(
        "TOO_MANY_REQUESTS",
        "Too many registration attempts. Please try again later.",
        429,
        { retryAfterSeconds: rateLimit.retryAfterSeconds }
      );
      if (rateLimit.retryAfterSeconds) {
        response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      }
      return response;
    }

    // 5. Register user via application service
    let registeredUser;
    try {
      registeredUser = await authService.registerUser({ email, password, fullName });
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        // 409 Conflict: email is already taken
        // Note: per the security architecture, callers may choose to return
        // a generic 200 to prevent account enumeration. We surface 409 here
        // because the duplicate can only be confirmed by the registrant themselves
        // and is consistent with standard REST semantics.
        return apiError(
          "EMAIL_ALREADY_REGISTERED",
          "An account with this email address already exists.",
          409
        );
      }
      if (err instanceof RegistrationPasswordPolicyError) {
        return apiError(
          "PASSWORD_POLICY_VIOLATION",
          err.message,
          400
        );
      }
      throw err;
    }

    // 6. Return 201 Created with safe user representation (no session token)
    return apiSuccess({ user: registeredUser }, 201);
  } catch (err) {
    console.error(
      "❌ Unexpected registration failure:",
      err instanceof Error ? err.message : err
    );
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
