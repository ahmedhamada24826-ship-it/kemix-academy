/**
 * Centralized Session & Authentication Configuration
 */
export const SESSION_CONFIG = {
  COOKIE_NAME: "session_token",
  DEFAULT_TTL_SECONDS: 30 * 24 * 60 * 60, // 30 days (default / rememberMe = true)
  SHORT_TTL_SECONDS: 24 * 60 * 60,        // 24 hours (rememberMe = false)
  PATH: "/",
  SAME_SITE: "lax" as const,
  HTTP_ONLY: true,
} as const;

export interface SessionCookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  maxAge: number;
  expires: Date;
}

/**
 * Builds standard HttpOnly cookie configuration for setting active sessions
 */
export function getSessionCookieOptions(
  token: string,
  expiresAt: Date,
  isSecure: boolean
): SessionCookieOptions {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return {
    name: SESSION_CONFIG.COOKIE_NAME,
    value: token,
    httpOnly: SESSION_CONFIG.HTTP_ONLY,
    sameSite: SESSION_CONFIG.SAME_SITE,
    secure: isSecure,
    path: SESSION_CONFIG.PATH,
    maxAge: maxAgeSeconds,
    expires: expiresAt,
  };
}

/**
 * Builds standard cookie configuration for immediately clearing/expiring sessions
 */
export function getExpiredSessionCookieOptions(isSecure: boolean): SessionCookieOptions {
  return {
    name: SESSION_CONFIG.COOKIE_NAME,
    value: "",
    httpOnly: SESSION_CONFIG.HTTP_ONLY,
    sameSite: SESSION_CONFIG.SAME_SITE,
    secure: isSecure,
    path: SESSION_CONFIG.PATH,
    maxAge: 0,
    expires: new Date(0),
  };
}
