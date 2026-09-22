import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { authService } from "@/server/application/auth/auth.service";

vi.mock("@/server/application/auth/auth.service", () => ({
  authService: {
    invalidateSession: vi.fn(),
  },
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        "origin": "http://localhost:3000",
        ...headers,
      },
    });
  }

  it("invalidates session and clears cookie when session_token is present", async () => {
    const req = createRequest({
      cookie: "session_token=active_raw_token_123",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(authService.invalidateSession).toHaveBeenCalledWith("active_raw_token_123");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("session_token=");
    expect(setCookie?.toLowerCase()).toContain("max-age=0");
  });

  it("is safe and idempotent when no session cookie exists", async () => {
    const req = createRequest();

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(authService.invalidateSession).not.toHaveBeenCalled();

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie?.toLowerCase()).toContain("max-age=0");
  });
});
