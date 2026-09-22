import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import {
  authService,
  AuthenticationError,
  AccountInactiveError,
} from "@/server/application/auth/auth.service";
import { rateLimiter } from "@/server/infrastructure/security/memory-rate-limiter";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

vi.mock("@/server/application/auth/auth.service", () => {
  class MockAuthenticationError extends Error {
    constructor(message = "Invalid email or password") {
      super(message);
      this.name = "AuthenticationError";
    }
  }

  class MockAccountInactiveError extends Error {
    constructor(message = "Account is not active") {
      super(message);
      this.name = "AccountInactiveError";
    }
  }

  return {
    authService: {
      authenticateUser: vi.fn(),
    },
    AuthenticationError: MockAuthenticationError,
    AccountInactiveError: MockAccountInactiveError,
  };
});

describe("POST /api/auth/login", () => {
  const mockUser: AuthenticatedUser = {
    id: "user-123",
    email: "student@kemix.academy",
    fullName: "Alex Rivera",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter.clear();
  });

  function createRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "http://localhost:3000",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("returns 200 and sets session cookie on valid credentials", async () => {
    vi.mocked(authService.authenticateUser).mockResolvedValue({
      user: mockUser,
      sessionToken: "mock_session_token_123",
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });

    const req = createRequest({
      email: "  Student@Kemix.Academy  ",
      password: "ValidPassword123!",
      rememberMe: true,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user).toEqual({
      ...mockUser,
      createdAt: mockUser.createdAt.toISOString(),
    });
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.sessionToken).toBeUndefined();

    // Verify Set-Cookie header is present
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain("session_token=mock_session_token_123");
    expect(cookieHeader?.toLowerCase()).toContain("httponly");
    expect(cookieHeader?.toLowerCase()).toContain("samesite=lax");
  });

  it("returns generic 401 when password is wrong", async () => {
    vi.mocked(authService.authenticateUser).mockRejectedValue(new AuthenticationError());

    const req = createRequest({
      email: "student@kemix.academy",
      password: "WrongPassword123!",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Invalid email or password");
  });

  it("returns generic 401 when email does not exist", async () => {
    vi.mocked(authService.authenticateUser).mockRejectedValue(new AuthenticationError());

    const req = createRequest({
      email: "nonexistent@kemix.academy",
      password: "Password123!",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Invalid email or password");
  });

  it("returns generic 401 when user account is inactive or suspended", async () => {
    vi.mocked(authService.authenticateUser).mockRejectedValue(new AccountInactiveError());

    const req = createRequest({
      email: "suspended@kemix.academy",
      password: "ValidPassword123!",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Invalid email or password");
  });

  it("returns 400 validation error on malformed input payload", async () => {
    const req = createRequest({
      email: "not-an-email",
      password: "",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.mocked(authService.authenticateUser).mockRejectedValue(new AuthenticationError());

    // Send 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const req = createRequest(
        { email: "rate@kemix.academy", password: "WrongPassword1!" },
        { "x-forwarded-for": "192.168.1.50" }
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
    }

    // 6th attempt should be blocked by rate limiter
    const blockedReq = createRequest(
      { email: "rate@kemix.academy", password: "WrongPassword1!" },
      { "x-forwarded-for": "192.168.1.50" }
    );
    const blockedRes = await POST(blockedReq);

    expect(blockedRes.status).toBe(429);
    const json = await blockedRes.json();
    expect(json.error.code).toBe("TOO_MANY_REQUESTS");
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
  });
});
