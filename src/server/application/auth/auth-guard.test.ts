import { describe, it, expect, vi } from "vitest";
import {
  extractTokenFromCookieHeader,
  getCurrentUser,
  requireAuthenticatedUser,
  requireRole,
  UnauthorizedException,
  ForbiddenException,
} from "./auth-guard";
import { AuthService } from "./auth.service";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { Role } from "@/types";

describe("AuthGuard & RBAC Helpers", () => {
  const mockStudentUser: AuthenticatedUser = {
    id: "user-std-1",
    email: "student@kemix.academy",
    fullName: "Student User",
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const mockAdminUser: AuthenticatedUser = {
    id: "user-adm-1",
    email: "admin@kemix.academy",
    fullName: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  const mockInstructorUser: AuthenticatedUser = {
    id: "user-inst-1",
    email: "instructor@kemix.academy",
    fullName: "Instructor User",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  describe("extractTokenFromCookieHeader", () => {
    it("extracts session token from valid Cookie header string", () => {
      const header = "theme=dark; session_token=secret_raw_token_123; other=val";
      expect(extractTokenFromCookieHeader(header)).toBe("secret_raw_token_123");
    });

    it("returns null if session_token is absent from Cookie header", () => {
      const header = "theme=dark; other=val";
      expect(extractTokenFromCookieHeader(header)).toBeNull();
      expect(extractTokenFromCookieHeader(null)).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("resolves user from string token using authService", async () => {
      const mockAuthService = {
        getAuthenticatedUser: vi.fn().mockResolvedValue(mockStudentUser),
      };

      const user = await getCurrentUser("valid_token", mockAuthService as unknown as AuthService);
      expect(user).toEqual(mockStudentUser);
      expect(mockAuthService.getAuthenticatedUser).toHaveBeenCalledWith("valid_token");
    });

    it("resolves user from Request object by extracting Cookie header", async () => {
      const mockAuthService = {
        getAuthenticatedUser: vi.fn().mockResolvedValue(mockAdminUser),
      };

      const req = new Request("http://localhost:3000/api/admin", {
        headers: {
          cookie: "session_token=admin_token_xyz",
        },
      });

      const user = await getCurrentUser(req, mockAuthService as unknown as AuthService);
      expect(user).toEqual(mockAdminUser);
      expect(mockAuthService.getAuthenticatedUser).toHaveBeenCalledWith("admin_token_xyz");
    });

    it("returns null if token or Request is missing or unauthenticated", async () => {
      const mockAuthService = {
        getAuthenticatedUser: vi.fn().mockResolvedValue(null),
      };

      expect(await getCurrentUser(null, mockAuthService as unknown as AuthService)).toBeNull();
      expect(await getCurrentUser("invalid_token", mockAuthService as unknown as AuthService)).toBeNull();
    });
  });

  describe("requireAuthenticatedUser", () => {
    it("returns AuthenticatedUser when user is authenticated", async () => {
      const mockAuthService = {
        getAuthenticatedUser: vi.fn().mockResolvedValue(mockStudentUser),
      };

      const user = await requireAuthenticatedUser("token_123", mockAuthService as unknown as AuthService);
      expect(user).toEqual(mockStudentUser);
    });

    it("throws UnauthorizedException when user is not authenticated", async () => {
      const mockAuthService = {
        getAuthenticatedUser: vi.fn().mockResolvedValue(null),
      };

      await expect(
        requireAuthenticatedUser("bad_token", mockAuthService as unknown as AuthService)
      ).rejects.toThrow(UnauthorizedException);
    });
  });


  describe("requireRole (RBAC)", () => {
    it("allows ADMIN user when ADMIN role is required", () => {
      const user = requireRole(["ADMIN"], mockAdminUser);
      expect(user).toEqual(mockAdminUser);
    });

    it("allows INSTRUCTOR user when INSTRUCTOR or ADMIN is allowed", () => {
      const allowedRoles: Role[] = ["ADMIN", "INSTRUCTOR"];
      const user = requireRole(allowedRoles, mockInstructorUser);
      expect(user).toEqual(mockInstructorUser);
    });

    it("allows STUDENT user when STUDENT is explicitly allowed", () => {
      const user = requireRole(["STUDENT"], mockStudentUser);
      expect(user).toEqual(mockStudentUser);
    });

    it("throws ForbiddenException when STUDENT attempts ADMIN-only operation", () => {
      expect(() => requireRole(["ADMIN"], mockStudentUser)).toThrow(ForbiddenException);
    });

    it("throws ForbiddenException when INSTRUCTOR attempts ADMIN-only operation", () => {
      expect(() => requireRole(["ADMIN"], mockInstructorUser)).toThrow(ForbiddenException);
    });

    it("throws UnauthorizedException when user is null", () => {
      expect(() => requireRole(["ADMIN"], null)).toThrow(UnauthorizedException);
    });
  });
});
