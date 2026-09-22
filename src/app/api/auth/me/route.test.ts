import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

vi.mock("@/server/application/auth/auth-guard", () => ({
  getCurrentUser: vi.fn(),
  extractTokenFromCookieHeader: vi.fn((cookieHeader: string | null) => {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/session_token=([^;]+)/);
    return match ? match[1] : null;
  }),
}));

describe("GET /api/auth/me", () => {
  const mockUser: AuthenticatedUser = {
    id: "user-456",
    email: "instructor@kemix.academy",
    fullName: "Elena Rostova",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: "https://media.kemix.academy/avatars/elena.webp",
    bio: "Senior SQL Instructor",
    createdAt: new Date("2026-02-01T00:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(cookieHeader?: string) {
    return new NextRequest("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  }

  it("returns 200 and safe AuthenticatedUser when session is valid", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    const req = createRequest("session_token=valid_token_abc");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user).toEqual({
      ...mockUser,
      createdAt: mockUser.createdAt.toISOString(),
    });
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.user.tokenHash).toBeUndefined();
  });

  it("returns 401 UNAUTHENTICATED when session_token cookie is missing", async () => {
    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHENTICATED");
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("returns 401 and clears stale cookie when token cannot be resolved", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const req = createRequest("session_token=expired_or_revoked_token");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHENTICATED");

    // Check that stale cookie is cleared
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie?.toLowerCase()).toContain("max-age=0");
  });
});
