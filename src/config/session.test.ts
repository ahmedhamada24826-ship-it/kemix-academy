import { describe, it, expect } from "vitest";
import {
  SESSION_CONFIG,
  getSessionCookieOptions,
  getExpiredSessionCookieOptions,
} from "./session";

describe("Session & Cookie Configuration", () => {
  it("enforces production-grade cookie security defaults", () => {
    expect(SESSION_CONFIG.COOKIE_NAME).toBe("session_token");
    expect(SESSION_CONFIG.HTTP_ONLY).toBe(true);
    expect(SESSION_CONFIG.SAME_SITE).toBe("lax");
    expect(SESSION_CONFIG.PATH).toBe("/");
    expect(SESSION_CONFIG.DEFAULT_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(SESSION_CONFIG.SHORT_TTL_SECONDS).toBe(24 * 60 * 60);
  });

  it("generates correct active session cookie options", () => {
    const rawToken = "sample_raw_token_xyz";
    const futureDate = new Date(Date.now() + 1000 * 3600); // 1 hour ahead
    const options = getSessionCookieOptions(rawToken, futureDate, true);

    expect(options.name).toBe("session_token");
    expect(options.value).toBe(rawToken);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(true);
    expect(options.path).toBe("/");
    expect(options.expires).toBe(futureDate);
    expect(options.maxAge).toBeGreaterThanOrEqual(3590);
  });

  it("generates correct expired cookie options for session invalidation/logout", () => {
    const options = getExpiredSessionCookieOptions(false);

    expect(options.name).toBe("session_token");
    expect(options.value).toBe("");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(0);
    expect(options.expires.getTime()).toBe(0);
  });
});
