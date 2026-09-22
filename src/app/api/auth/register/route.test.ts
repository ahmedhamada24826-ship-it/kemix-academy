import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import {
  authService,
  EmailAlreadyRegisteredError,
  RegistrationPasswordPolicyError,
} from "@/server/application/auth/auth.service";
import { rateLimiter } from "@/server/infrastructure/security/memory-rate-limiter";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

vi.mock("@/server/application/auth/auth.service", () => {
  class MockEmailAlreadyRegisteredError extends Error {
    constructor(message = "An account with this email already exists") {
      super(message);
      this.name = "EmailAlreadyRegisteredError";
    }
  }

  class MockRegistrationPasswordPolicyError extends Error {
    constructor(message = "Password does not meet requirements") {
      super(message);
      this.name = "RegistrationPasswordPolicyError";
    }
  }

  return {
    authService: {
      registerUser: vi.fn(),
    },
    EmailAlreadyRegisteredError: MockEmailAlreadyRegisteredError,
    RegistrationPasswordPolicyError: MockRegistrationPasswordPolicyError,
  };
});

// Platform settings gate registration (allowRegistration). Keep tests hermetic —
// no live database required.
vi.mock("@/server/application/settings/settings.service", () => ({
  platformSettingsService: {
    getSettings: vi.fn().mockResolvedValue({ allowRegistration: true }),
  },
}));

describe("POST /api/auth/register", () => {
  const mockRegisteredUser: AuthenticatedUser = {
    id: "new-user-789",
    email: "newstudent@kemix.academy",
    fullName: "Sam Chen",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter.clear();
  });

  function createRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "http://localhost:3000",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("returns 201 Created with safe user data on successful registration", async () => {
    vi.mocked(authService.registerUser).mockResolvedValue(mockRegisteredUser);

    const req = createRequest({
      email: "  NewStudent@Kemix.Academy  ",
      password: "SecureP@ss1!",
      fullName: "  Sam Chen  ",
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.id).toBe("new-user-789");
    expect(json.data.user.email).toBe("newstudent@kemix.academy");
    expect(json.data.user.role).toBe("STUDENT");
    // Sensitive fields must never be returned
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.sessionToken).toBeUndefined();
    // No Set-Cookie header on registration (login is a separate step)
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeNull();
  });

  it("passes normalized email and trimmed fullName to the service", async () => {
    vi.mocked(authService.registerUser).mockResolvedValue(mockRegisteredUser);

    const req = createRequest({
      email: "  NewStudent@Kemix.Academy  ",
      password: "SecureP@ss1!",
      fullName: "  Sam Chen  ",
    });

    await POST(req);

    expect(authService.registerUser).toHaveBeenCalledWith({
      email: "newstudent@kemix.academy",
      password: "SecureP@ss1!",
      fullName: "Sam Chen",
    });
  });

  it("returns 409 Conflict when email is already registered", async () => {
    vi.mocked(authService.registerUser).mockRejectedValue(
      new EmailAlreadyRegisteredError()
    );

    const req = createRequest({
      email: "existing@kemix.academy",
      password: "ValidP@ss1!",
      fullName: "Existing User",
    });

    const res = await POST(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("returns 400 when service rejects password with RegistrationPasswordPolicyError", async () => {
    // This covers the case where a future code path bypasses Zod but fails the service-level check
    vi.mocked(authService.registerUser).mockRejectedValue(
      new RegistrationPasswordPolicyError("Password must contain at least one special character")
    );

    const req = createRequest({
      email: "newuser@kemix.academy",
      // A password that's syntactically valid JSON but we mock the service to reject it
      password: "ValidP@ss1!",
      fullName: "New User",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("PASSWORD_POLICY_VIOLATION");
    expect(json.error.message).toContain("Password");
  });

  it("returns 400 validation error on malformed payload (Zod schema rejection)", async () => {
    const req = createRequest({
      email: "not-an-email",
      password: "",
      fullName: "X",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details).toBeDefined();
    // Service should not be called when Zod rejects the payload
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it("returns 400 when fullName is too short (Zod schema rejection)", async () => {
    const req = createRequest({
      email: "valid@kemix.academy",
      password: "ValidP@ss1!",
      fullName: "X",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it("returns 400 when password is too weak (Zod schema catches missing complexity)", async () => {
    // Zod registerRequestSchema uses passwordSchema which enforces all complexity rules
    const req = createRequest({
      email: "valid@kemix.academy",
      password: "short",
      fullName: "Valid Name",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    // registerUser should not be called if Zod rejects the payload
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "http://localhost:3000",
      },
      body: "{not valid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("INVALID_JSON");
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it("returns 429 when registration rate limit is exceeded", async () => {
    vi.mocked(authService.registerUser).mockResolvedValue(mockRegisteredUser);

    // Exhaust the 3 registration attempts from the same IP
    for (let i = 0; i < 3; i++) {
      const req = createRequest(
        {
          email: `user${i}@kemix.academy`,
          password: "ValidP@ss1!",
          fullName: `User Number ${i}`,
        },
        { "x-forwarded-for": "10.0.0.1" }
      );
      await POST(req);
    }

    // 4th attempt from same IP should be blocked
    const blockedReq = createRequest(
      { email: "another@kemix.academy", password: "ValidP@ss1!", fullName: "Another User" },
      { "x-forwarded-for": "10.0.0.1" }
    );
    const blockedRes = await POST(blockedReq);

    expect(blockedRes.status).toBe(429);
    const json = await blockedRes.json();
    expect(json.error.code).toBe("TOO_MANY_REQUESTS");
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
  });
});
