import { Role } from "@/types";

export type Permission =
  | "course:create"
  | "course:edit_own"
  | "course:edit_any"
  | "course:delete"
  | "course:publish"
  | "media:upload"
  | "media:delete"
  | "quiz:grade"
  | "users:manage"
  | "settings:manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
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
  ],
  INSTRUCTOR: [
    "course:create",
    "course:edit_own",
    "media:upload",
    "quiz:grade",
  ],
  STUDENT: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
