import {
  LoginInput,
  RegisterInput,
  AuthResult,
  AuthenticatedUser,
} from "@/server/domain/auth/auth.types";

/**
 * Application Service Contract for Server-Side Authentication
 */
export interface IAuthService {
  /**
   * Registers a new student account.
   * Validates email uniqueness, enforces password policy, hashes password,
   * and creates the user record with role=STUDENT and status=ACTIVE.
   * Returns a safe AuthenticatedUser representation (no session created).
   */
  registerUser(input: RegisterInput): Promise<AuthenticatedUser>;

  /**
   * Authenticates user with email and password credentials.
   * On success, creates a persisted session and returns safe auth result.
   */
  authenticateUser(input: LoginInput): Promise<AuthResult>;

  /**
   * Verifies a plain text password against a stored password hash.
   */
  verifyPassword(passwordHash: string, plainText: string): Promise<boolean>;

  /**
   * Creates a new cryptographically secure session for a user.
   */
  createSession(
    userId: string,
    rememberMe?: boolean
  ): Promise<{ sessionToken: string; expiresAt: Date; user: AuthenticatedUser }>;

  /**
   * Invalidates / revokes an existing session by its raw token.
   */
  invalidateSession(sessionToken: string): Promise<void>;

  /**
   * Revokes ALL active sessions for a given user ID.
   *
   * Used during security-sensitive operations such as password changes
   * and password resets to invalidate all concurrent sessions and force
   * re-authentication on all devices. (Security Architecture Stage 7 & 9)
   */
  revokeAllUserSessions(userId: string): Promise<void>;

  /**
   * Resolves and validates an authenticated user from a raw session token.
   * Rejects expired, revoked, or non-active user sessions.
   */
  getAuthenticatedUser(sessionToken: string): Promise<AuthenticatedUser | null>;
}

