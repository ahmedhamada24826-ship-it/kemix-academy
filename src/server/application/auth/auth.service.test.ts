import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AuthService,
  AuthenticationError,
  AccountInactiveError,
  EmailAlreadyRegisteredError,
  RegistrationPasswordPolicyError,
} from "./auth.service";
import { IPasswordHasher } from "@/server/domain/security/hasher.interface";
import { hashSessionToken } from "@/server/infrastructure/security/session-token";
import { PrismaClient, User, Role, UserStatus } from "@prisma/client";

describe("AuthService", () => {
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    session: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };
  let mockHasher: IPasswordHasher;
  let authService: AuthService;

  const mockActiveUser: User = {
    id: "user-123",
    email: "student@kemix.academy",
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehash",
    fullName: "Alex Rivera",
    role: "STUDENT" as Role,
    status: "ACTIVE" as UserStatus,
    avatarUrl: null,
    bio: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      session: {
        create: vi.fn().mockResolvedValue({ id: "session-1" }),
        findUnique: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockHasher = {
      hash: vi.fn().mockResolvedValue("mock_hash"),
      verify: vi.fn().mockImplementation(async (_hash: string, plain: string) => plain === "CorrectP@ss1!"),
    };

    authService = new AuthService(mockPrisma as unknown as PrismaClient, mockHasher);
  });

  describe("authenticateUser", () => {
    it("successfully authenticates a valid active user and returns a safe AuthenticatedUser", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockActiveUser);

      const result = await authService.authenticateUser({
        email: "  STUDENT@KEMIX.ACADEMY  ", // tests normalization
        password: "CorrectP@ss1!",
        rememberMe: true,
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "student@kemix.academy" },
      });
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("user-123");
      expect(result.user.email).toBe("student@kemix.academy");
      expect(result.user.role).toBe("STUDENT");
      expect(result.user.status).toBe("ACTIVE");
      expect("passwordHash" in (result.user || {})).toBe(false);
      expect(result.sessionToken).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockPrisma.session.create).toHaveBeenCalled();
    });

    it("fails with generic AuthenticationError if user is not found and runs dummy verify", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.authenticateUser({
          email: "unknown@kemix.academy",
          password: "SomePassword123!",
        })
      ).rejects.toThrow(AuthenticationError);

      expect(mockHasher.verify).toHaveBeenCalled();
    });

    it("fails with generic AuthenticationError on invalid password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockActiveUser);

      await expect(
        authService.authenticateUser({
          email: "student@kemix.academy",
          password: "WrongPassword!99",
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it("rejects authentication if account is SUSPENDED or DISABLED", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockActiveUser,
        status: "SUSPENDED" as UserStatus,
      });

      await expect(
        authService.authenticateUser({
          email: "student@kemix.academy",
          password: "CorrectP@ss1!",
        })
      ).rejects.toThrow(AccountInactiveError);

      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe("verifyPassword", () => {
    it("returns true for matching password", async () => {
      const isValid = await authService.verifyPassword(
        mockActiveUser.passwordHash,
        "CorrectP@ss1!"
      );
      expect(isValid).toBe(true);
    });

    it("returns false for non-matching password", async () => {
      const isValid = await authService.verifyPassword(
        mockActiveUser.passwordHash,
        "WrongPass123!"
      );
      expect(isValid).toBe(false);
    });

    it("returns false for empty inputs", async () => {
      expect(await authService.verifyPassword("", "password")).toBe(false);
      expect(await authService.verifyPassword("hash", "")).toBe(false);
    });
  });

  describe("invalidateSession", () => {
    it("hashes the raw token and sets revokedAt timestamp", async () => {
      const rawToken = "sample_raw_session_token";
      const expectedHash = hashSessionToken(rawToken);

      await authService.invalidateSession(rawToken);

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expectedHash,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it("gracefully ignores empty session tokens", async () => {
      await authService.invalidateSession("");
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getAuthenticatedUser", () => {
    const rawToken = "valid_session_token_xyz";
    const expectedHash = hashSessionToken(rawToken);

    it("resolves user from active, valid, non-expired session", async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-123",
        tokenHash: expectedHash,
        expiresAt: new Date(Date.now() + 1000 * 3600), // 1h in future
        revokedAt: null,
        user: mockActiveUser,
      });

      const user = await authService.getAuthenticatedUser(rawToken);

      expect(user).toBeDefined();
      expect(user?.id).toBe("user-123");
      expect(user?.email).toBe("student@kemix.academy");
      expect("passwordHash" in (user || {})).toBe(false);
    });

    it("returns null if session does not exist in database", async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const user = await authService.getAuthenticatedUser("unknown_token");
      expect(user).toBeNull();
    });

    it("returns null if session is expired", async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-123",
        tokenHash: expectedHash,
        expiresAt: new Date(Date.now() - 1000 * 3600), // 1h in past
        revokedAt: null,
        user: mockActiveUser,
      });

      const user = await authService.getAuthenticatedUser(rawToken);
      expect(user).toBeNull();
    });

    it("returns null if session has been revoked", async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-123",
        tokenHash: expectedHash,
        expiresAt: new Date(Date.now() + 1000 * 3600),
        revokedAt: new Date(Date.now() - 1000 * 60), // revoked 1 min ago
        user: mockActiveUser,
      });

      const user = await authService.getAuthenticatedUser(rawToken);
      expect(user).toBeNull();
    });

    it("returns null if user account status is DISABLED or SUSPENDED", async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-123",
        tokenHash: expectedHash,
        expiresAt: new Date(Date.now() + 1000 * 3600),
        revokedAt: null,
        user: { ...mockActiveUser, status: "DISABLED" as UserStatus },
      });

      const user = await authService.getAuthenticatedUser(rawToken);
      expect(user).toBeNull();
    });

    it("returns null for empty token input without database query", async () => {
      const user = await authService.getAuthenticatedUser("");
      expect(user).toBeNull();
      expect(mockPrisma.session.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("registerUser", () => {
    const validInput = {
      email: "  NewUser@KEMIX.Academy  ",
      password: "SecureP@ss1!",
      fullName: "  Alex Rivera  ",
    };

    const createdUserRecord: User = {
      id: "new-user-456",
      email: "newuser@kemix.academy",
      passwordHash: "$argon2id$v=19$...",
      fullName: "Alex Rivera",
      role: "STUDENT" as Role,
      status: "ACTIVE" as UserStatus,
      avatarUrl: null,
      bio: null,
      createdAt: new Date("2026-09-01T00:00:00Z"),
      updatedAt: new Date("2026-09-01T00:00:00Z"),
    };

    it("successfully registers a new user and returns a safe AuthenticatedUser", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUserRecord);

      const result = await authService.registerUser(validInput);

      // Email should be normalized before DB call
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "newuser@kemix.academy" },
      });

      // User should be created with normalized data
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "newuser@kemix.academy",
          fullName: "Alex Rivera",
          role: "STUDENT",
          status: "ACTIVE",
          passwordHash: expect.any(String),
        }),
      });

      // Result must be a safe AuthenticatedUser
      expect(result.id).toBe("new-user-456");
      expect(result.email).toBe("newuser@kemix.academy");
      expect(result.role).toBe("STUDENT");
      expect(result.status).toBe("ACTIVE");
      expect("passwordHash" in result).toBe(false);
    });

    it("normalizes email to lowercase and trims whitespace before storage", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...createdUserRecord,
        email: "newuser@kemix.academy",
      });

      await authService.registerUser(validInput);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "newuser@kemix.academy" },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: "newuser@kemix.academy" }),
      });
    });

    it("trims whitespace from fullName before storage", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUserRecord);

      await authService.registerUser(validInput);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ fullName: "Alex Rivera" }),
      });
    });

    it("throws EmailAlreadyRegisteredError if email is already taken", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockActiveUser);

      await expect(
        authService.registerUser(validInput)
      ).rejects.toThrow(EmailAlreadyRegisteredError);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("throws RegistrationPasswordPolicyError for a weak password", async () => {
      await expect(
        authService.registerUser({
          email: "newuser@kemix.academy",
          password: "weak",
          fullName: "Alex Rivera",
        })
      ).rejects.toThrow(RegistrationPasswordPolicyError);

      // Should not even query the DB if password policy fails
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("throws RegistrationPasswordPolicyError for password without special characters", async () => {
      await expect(
        authService.registerUser({
          email: "test@kemix.academy",
          password: "Password123",
          fullName: "Test User",
        })
      ).rejects.toThrow(RegistrationPasswordPolicyError);
    });

    it("hashes the password with Argon2id before creating the user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUserRecord);

      await authService.registerUser(validInput);

      expect(mockHasher.hash).toHaveBeenCalledWith("SecureP@ss1!");
      // The passwordHash stored is the mock hash value, not plaintext
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ passwordHash: "mock_hash" }),
      });
    });
  });

  describe("revokeAllUserSessions", () => {
    it("sets revokedAt on all active sessions for the given userId", async () => {
      await authService.revokeAllUserSessions("user-123");

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it("gracefully ignores empty userId without making a database call", async () => {
      await authService.revokeAllUserSessions("");
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });

    it("targets only non-revoked sessions (revokedAt: null) to avoid double-revocation", async () => {
      await authService.revokeAllUserSessions("user-456");

      const callArgs = mockPrisma.session.updateMany.mock.calls[0][0];
      expect(callArgs.where.revokedAt).toBeNull();
      expect(callArgs.where.userId).toBe("user-456");
    });
  });
});
