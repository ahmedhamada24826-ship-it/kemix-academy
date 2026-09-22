import { describe, it, expect } from "vitest";
import {
  hasPermission,
  ROLE_PERMISSIONS,
  Permission,
} from "./rbac.types";
import { Role } from "@/types";

describe("RBAC — hasPermission() & ROLE_PERMISSIONS", () => {
  // ─── ADMIN ────────────────────────────────────────────────────────────────

  describe("ADMIN role", () => {
    it("has all defined permissions", () => {
      const allPermissions: Permission[] = [
        "course:create",
        "course:edit_own",
        "course:edit_any",
        "course:delete",
        "course:publish",
        "media:upload",
        "media:delete",
        "quiz:grade",
        "users:manage",
        "settings:manage",
      ];

      for (const permission of allPermissions) {
        expect(hasPermission("ADMIN", permission)).toBe(true);
      }
    });

    it("has course management (create, edit any, delete, publish)", () => {
      expect(hasPermission("ADMIN", "course:create")).toBe(true);
      expect(hasPermission("ADMIN", "course:edit_own")).toBe(true);
      expect(hasPermission("ADMIN", "course:edit_any")).toBe(true);
      expect(hasPermission("ADMIN", "course:delete")).toBe(true);
      expect(hasPermission("ADMIN", "course:publish")).toBe(true);
    });

    it("has platform governance permissions (users:manage, settings:manage)", () => {
      expect(hasPermission("ADMIN", "users:manage")).toBe(true);
      expect(hasPermission("ADMIN", "settings:manage")).toBe(true);
    });
  });

  // ─── INSTRUCTOR ───────────────────────────────────────────────────────────

  describe("INSTRUCTOR role", () => {
    it("can create and edit own courses", () => {
      expect(hasPermission("INSTRUCTOR", "course:create")).toBe(true);
      expect(hasPermission("INSTRUCTOR", "course:edit_own")).toBe(true);
    });

    it("can upload media and grade quizzes", () => {
      expect(hasPermission("INSTRUCTOR", "media:upload")).toBe(true);
      expect(hasPermission("INSTRUCTOR", "quiz:grade")).toBe(true);
    });

    it("cannot edit other instructors' courses", () => {
      expect(hasPermission("INSTRUCTOR", "course:edit_any")).toBe(false);
    });

    it("cannot delete courses", () => {
      expect(hasPermission("INSTRUCTOR", "course:delete")).toBe(false);
    });

    it("cannot publish courses without admin approval", () => {
      expect(hasPermission("INSTRUCTOR", "course:publish")).toBe(false);
    });

    it("cannot manage users or platform settings", () => {
      expect(hasPermission("INSTRUCTOR", "users:manage")).toBe(false);
      expect(hasPermission("INSTRUCTOR", "settings:manage")).toBe(false);
    });

    it("cannot delete media assets", () => {
      expect(hasPermission("INSTRUCTOR", "media:delete")).toBe(false);
    });
  });

  // ─── STUDENT ──────────────────────────────────────────────────────────────

  describe("STUDENT role", () => {
    it("has no administrative permissions", () => {
      const adminPermissions: Permission[] = [
        "course:create",
        "course:edit_own",
        "course:edit_any",
        "course:delete",
        "course:publish",
        "media:upload",
        "media:delete",
        "quiz:grade",
        "users:manage",
        "settings:manage",
      ];

      for (const permission of adminPermissions) {
        expect(hasPermission("STUDENT", permission)).toBe(false);
      }
    });

    it("has an empty permission set in ROLE_PERMISSIONS", () => {
      expect(ROLE_PERMISSIONS["STUDENT"]).toHaveLength(0);
    });
  });

  // ─── ROLE_PERMISSIONS completeness ────────────────────────────────────────

  describe("ROLE_PERMISSIONS coverage", () => {
    it("defines permission sets for all three roles", () => {
      const roles: Role[] = ["ADMIN", "INSTRUCTOR", "STUDENT"];
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it("ADMIN has strictly more permissions than INSTRUCTOR", () => {
      const adminPerms = new Set(ROLE_PERMISSIONS["ADMIN"]);
      const instructorPerms = ROLE_PERMISSIONS["INSTRUCTOR"];

      for (const perm of instructorPerms) {
        expect(adminPerms.has(perm)).toBe(true);
      }
      expect(ROLE_PERMISSIONS["ADMIN"].length).toBeGreaterThan(
        ROLE_PERMISSIONS["INSTRUCTOR"].length
      );
    });

    it("INSTRUCTOR has strictly more permissions than STUDENT", () => {
      expect(ROLE_PERMISSIONS["INSTRUCTOR"].length).toBeGreaterThan(
        ROLE_PERMISSIONS["STUDENT"].length
      );
    });

    it("returns false for unknown roles gracefully", () => {
      // Defensive: unknown role returns false without throwing
      expect(hasPermission("UNKNOWN" as Role, "course:create")).toBe(false);
    });
  });
});
