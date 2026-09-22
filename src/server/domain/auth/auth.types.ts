import { Role, UserStatus } from "@/types";

/**
 * Safe client-facing / application-facing authenticated user representation.
 * Explicitly excludes passwordHash, raw session tokens, and database token hashes.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: AuthenticatedUser;
  sessionToken: string;
  expiresAt: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  user: AuthenticatedUser | null;
  expiresAt?: Date;
  reason?: "NOT_FOUND" | "EXPIRED" | "REVOKED" | "ACCOUNT_INACTIVE";
}
