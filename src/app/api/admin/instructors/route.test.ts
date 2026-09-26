import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { prisma } from "@/lib/prisma";
import { passwordHasher } from "@/server/infrastructure/security/argon2-hasher";

vi.mock("@/server/application/auth/auth-guard", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/infrastructure/security/argon2-hasher", () => ({
  passwordHasher: { hash: vi.fn() },
}));

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  fullName: "Admin",
  role: "ADMIN" as const,
  status: "ACTIVE" as const,
  avatarUrl: null,
  bio: null,
  createdAt: new Date(),
};

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/instructors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/instructors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an instructor with a hashed password", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(passwordHasher.hash).mockResolvedValue("argon2-hash");
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "instructor-1",
      fullName: "New Instructor",
      email: "instructor@example.com",
      avatarUrl: null,
      bio: "Data educator",
    } as never);

    const response = await POST(createRequest({
      fullName: "New Instructor",
      email: "Instructor@Example.com",
      password: "StrongPass123!",
      bio: "Data educator",
    }));
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(passwordHasher.hash).toHaveBeenCalledWith("StrongPass123!");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "instructor@example.com",
          passwordHash: "argon2-hash",
          role: "INSTRUCTOR",
        }),
      })
    );
    expect(JSON.stringify(result)).not.toContain("StrongPass123!");
  });

  it("rejects non-admin requests", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...admin, role: "INSTRUCTOR" });

    const response = await POST(createRequest({
      fullName: "New Instructor",
      email: "instructor@example.com",
      password: "StrongPass123!",
    }));

    expect(response.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});