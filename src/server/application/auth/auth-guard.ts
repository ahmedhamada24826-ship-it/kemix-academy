import { Role } from "@/types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { authService as defaultAuthService, AuthService } from "./auth.service";
import { SESSION_CONFIG } from "@/config/session";

export class UnauthorizedException extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedException";
  }
}

export class ForbiddenException extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "ForbiddenException";
  }
}

/**
 * Extracts session token from a Cookie header string.
 */
export function extractTokenFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const prefix = `${SESSION_CONFIG.COOKIE_NAME}=`;
  const sessionCookie = cookies.find((c) => c.startsWith(prefix));

  if (!sessionCookie) return null;
  return sessionCookie.substring(prefix.length);
}

/**
 * Extracts session token from Authorization: Bearer <token> or Cookie header.
 */
export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieHeader = req.headers.get("cookie");
  return extractTokenFromCookieHeader(cookieHeader);
}

/**
 * Resolves the authenticated user from a raw token string, a Request object, or cookie header.
 */
export async function getCurrentUser(
  tokenOrRequest?: string | Request | null,
  authService: AuthService = defaultAuthService
): Promise<AuthenticatedUser | null> {
  if (!tokenOrRequest) return null;

  let token: string | null = null;

  if (typeof tokenOrRequest === "string") {
    token = tokenOrRequest;
  } else if (tokenOrRequest instanceof Request) {
    token = extractTokenFromRequest(tokenOrRequest);
  }

  if (!token) return null;

  return authService.getAuthenticatedUser(token);
}

/**
 * Enforces that the request has a valid, active authenticated user session.
 * Throws UnauthorizedException if authentication fails.
 */
export async function requireAuthenticatedUser(
  tokenOrRequest?: string | Request | null,
  authService: AuthService = defaultAuthService
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(tokenOrRequest, authService);

  if (!user) {
    throw new UnauthorizedException("Authentication required");
  }

  return user;
}

/**
 * Enforces Role-Based Access Control (RBAC).
 *
 * Checks if the user holds one of the specified allowed roles.
 * Throws UnauthorizedException if user is not authenticated.
 * Throws ForbiddenException if user lacks the required role.
 */
export function requireRole(
  allowedRoles: Role[],
  user: AuthenticatedUser | null
): AuthenticatedUser {
  if (!user) {
    throw new UnauthorizedException("Authentication required");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenException(
      `Access denied: Required role [${allowedRoles.join(", ")}], user has [${user.role}]`
    );
  }

  return user;
}
