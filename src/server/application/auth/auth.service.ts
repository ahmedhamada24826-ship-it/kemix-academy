import { PrismaClient, User } from "@prisma/client";
import { IPasswordHasher } from "@/server/domain/security/hasher.interface";
import { passwordHasher as defaultHasher } from "@/server/infrastructure/security/argon2-hasher";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { normalizeEmail } from "@/server/domain/auth/email-normalizer";
import { validatePassword } from "@/server/domain/auth/password-policy";
import {
  generateRawSessionToken,
  hashSessionToken,
} from "@/server/infrastructure/security/session-token";
import { SESSION_CONFIG } from "@/config/session";
import {
  LoginInput,
  RegisterInput,
  AuthResult,
  AuthenticatedUser,
} from "@/server/domain/auth/auth.types";
import { IAuthService } from "./auth.service.interface";


/**
 * Standard dummy Argon2id hash used to equalize execution time on failed lookups
 * and mitigate timing-based user enumeration attacks.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQxMjM0NTY3OA$qO/h/vUa9Y0f/r4u4e+2zG+5T5vQ5O3z";

export class AuthenticationError extends Error {
  constructor(message = "Invalid email or password") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AccountInactiveError extends Error {
  constructor(message = "Account is not active") {
    super(message);
    this.name = "AccountInactiveError";
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(message = "An account with this email already exists") {
    super(message);
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class RegistrationPasswordPolicyError extends Error {
  constructor(message = "Password does not meet requirements") {
    super(message);
    this.name = "RegistrationPasswordPolicyError";
  }
}

function mapToAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export class AuthService implements IAuthService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly hasher: IPasswordHasher = defaultHasher
  ) {}

  /**
   * Registers a new student account.
   *
   * Security properties:
   * - Normalizes email before uniqueness check and storage.
   * - Validates password against the platform complexity policy.
   * - Hashes password with Argon2id before persistence.
   * - Throws EmailAlreadyRegisteredError if email is taken (caller decides
   *   whether to surface this or return a generic response to prevent enumeration).
   */
  async registerUser(input: RegisterInput): Promise<AuthenticatedUser> {
    const normalizedEmail = normalizeEmail(input.email);
    const fullName = input.fullName.trim();

    // 1. Validate password policy
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new RegistrationPasswordPolicyError(passwordValidation.error);
    }

    // 2. Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    // 3. Hash the password with Argon2id
    const passwordHash = await this.hasher.hash(input.password);

    // 4. Persist new user record
    const newUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    return mapToAuthenticatedUser(newUser);
  }

  /**
   * Authenticates user with email and password credentials.
   * Mitigates timing attacks by verifying a dummy hash when the user does not exist.
   */
  async authenticateUser(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(input.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Equalize timing
      await this.hasher.verify(DUMMY_HASH, input.password || "dummy");
      throw new AuthenticationError();
    }

    const isPasswordValid = await this.verifyPassword(
      user.passwordHash,
      input.password
    );

    if (!isPasswordValid) {
      throw new AuthenticationError();
    }

    if (user.status !== "ACTIVE") {
      throw new AccountInactiveError();
    }

    const { sessionToken, expiresAt, user: authenticatedUser } =
      await this.createSession(user.id, input.rememberMe);

    return {
      user: authenticatedUser,
      sessionToken,
      expiresAt,
    };
  }

  /**
   * Verifies plain text password against stored hash using the configured hasher.
   */
  async verifyPassword(passwordHash: string, plainText: string): Promise<boolean> {
    if (!passwordHash || !plainText) return false;
    return this.hasher.verify(passwordHash, plainText);
  }

  /**
   * Creates a new cryptographically secure session record in PostgreSQL.
   */
  async createSession(
    userId: string,
    rememberMe = true
  ): Promise<{ sessionToken: string; expiresAt: Date; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AccountInactiveError();
    }

    const ttlSeconds = rememberMe
      ? SESSION_CONFIG.DEFAULT_TTL_SECONDS
      : SESSION_CONFIG.SHORT_TTL_SECONDS;

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const rawToken = generateRawSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      sessionToken: rawToken,
      expiresAt,
      user: mapToAuthenticatedUser(user),
    };
  }

  /**
   * Revokes an existing session by setting its revokedAt timestamp.
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    if (!sessionToken) return;
    const tokenHash = hashSessionToken(sessionToken);

    await this.prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revokes ALL active sessions for a given user ID.
   *
   * Used during security-sensitive operations:
   * - Password change (Stage 7): revoke all sessions except the current one (caller's responsibility)
   * - Password reset (Stage 9): revoke all sessions unconditionally
   *
   * Sets revokedAt rather than hard-deleting to preserve the audit trail.
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    if (!userId) return;

    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Resolves an authenticated user from a raw session token.
   * Returns null if session does not exist, is expired, is revoked, or belongs to an inactive user.
   */
  async getAuthenticatedUser(
    sessionToken: string
  ): Promise<AuthenticatedUser | null> {
    if (!sessionToken) return null;

    const tokenHash = hashSessionToken(sessionToken);

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;
    if (session.revokedAt !== null) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    if (session.user.status !== "ACTIVE") return null;

    return mapToAuthenticatedUser(session.user);
  }
}

export const authService = new AuthService();
