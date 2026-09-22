import { describe, it, expect, beforeEach, vi } from "vitest";
import { bootstrapAdmin } from "./admin-bootstrap";
import { IPasswordHasher } from "@/server/domain/security/hasher.interface";
import { PrismaClient, User } from "@prisma/client";

describe("Admin Bootstrap", () => {
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let mockHasher: IPasswordHasher;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    mockHasher = {
      hash: vi.fn().mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$hashed_admin_pass"),
      verify: vi.fn(),
    };
  });

  it("successfully bootstraps a new admin account when valid config is provided", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(async ({ data }: { data: Partial<User> }) => ({
      id: "admin-1",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl: null,
      bio: null,
    }));

    const result = await bootstrapAdmin(
      {
        email: "  ADMIN@KEMIX.ACADEMY  ",
        password: "AdminSecurePassword2026!",
        fullName: "  Kemix Administrator  ",
      },
      mockPrisma as unknown as PrismaClient,
      mockHasher
    );

    expect(result.bootstrapped).toBe(true);
    expect(result.reason).toBe("SUCCESS");
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("admin@kemix.academy"); // Normalized
    expect(result.user?.role).toBe("ADMIN");
    expect(result.user?.status).toBe("ACTIVE");
    expect("passwordHash" in (result.user || {})).toBe(false);

    // Verify password was hashed and not stored in plaintext
    expect(mockHasher.hash).toHaveBeenCalledWith("AdminSecurePassword2026!");
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "admin@kemix.academy",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$hashed_admin_pass",
        fullName: "Kemix Administrator",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
  });

  it("is idempotent: preserves existing admin and does not overwrite password", async () => {
    const existingAdmin = {
      id: "existing-admin-id",
      email: "admin@kemix.academy",
      passwordHash: "$argon2id$existing_admin_hash_must_not_change",
      fullName: "Existing Admin",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.user.findUnique.mockResolvedValue(existingAdmin);

    const result = await bootstrapAdmin(
      {
        email: "admin@kemix.academy",
        password: "NewDifferentPassword2026!",
        fullName: "New Name",
      },
      mockPrisma as unknown as PrismaClient,
      mockHasher
    );

    expect(result.bootstrapped).toBe(false);
    expect(result.reason).toBe("ADMIN_ALREADY_EXISTS");
    expect(result.user?.id).toBe("existing-admin-id");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockHasher.hash).not.toHaveBeenCalled();
  });

  it("safely skips when configuration is missing without throwing or creating accounts", async () => {
    const result = await bootstrapAdmin(
      {
        email: undefined,
        password: undefined,
        fullName: undefined,
      },
      mockPrisma as unknown as PrismaClient,
      mockHasher
    );

    expect(result.bootstrapped).toBe(false);
    expect(result.reason).toBe("CONFIG_MISSING");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects admin bootstrap if password does not meet password policy", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await bootstrapAdmin(
      {
        email: "admin@kemix.academy",
        password: "short", // Fails policy
        fullName: "Kemix Admin",
      },
      mockPrisma as unknown as PrismaClient,
      mockHasher
    );

    expect(result.bootstrapped).toBe(false);
    expect(result.reason).toBe("PASSWORD_POLICY_VIOLATION");
    expect(result.error).toBeDefined();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockHasher.hash).not.toHaveBeenCalled();
  });
});
