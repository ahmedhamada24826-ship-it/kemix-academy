import { PrismaClient } from "@prisma/client";
import { IPasswordHasher } from "@/server/domain/security/hasher.interface";
import { passwordHasher as defaultHasher } from "@/server/infrastructure/security/argon2-hasher";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { normalizeEmail } from "@/server/domain/auth/email-normalizer";
import { validatePassword } from "@/server/domain/auth/password-policy";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface AdminBootstrapConfig {
  email?: string;
  password?: string;
  fullName?: string;
}

export interface AdminBootstrapResult {
  bootstrapped: boolean;
  reason?: "CONFIG_MISSING" | "ADMIN_ALREADY_EXISTS" | "PASSWORD_POLICY_VIOLATION" | "SUCCESS";
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Bootstraps the foundational superadmin account safely and idempotently.
 *
 * Rules:
 * - Requires email, password, and fullName to be provided via environment or config.
 * - Normalizes the email before lookup and storage.
 * - Validates the password against the centralized password policy.
 * - Hashes the password using Argon2id.
 * - If the admin account already exists, leaves it completely untouched (does NOT overwrite password).
 * - Never logs or stores plaintext passwords.
 */
export async function bootstrapAdmin(
  config: AdminBootstrapConfig = {
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
    fullName: process.env.INITIAL_ADMIN_NAME,
  },
  prisma: PrismaClient = defaultPrisma,
  hasher: IPasswordHasher = defaultHasher
): Promise<AdminBootstrapResult> {
  const email = config.email?.trim();
  const password = config.password;
  const fullName = config.fullName?.trim();

  // If initial admin credentials are not provided, safely skip
  if (!email || !password || !fullName) {
    return {
      bootstrapped: false,
      reason: "CONFIG_MISSING",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      bootstrapped: false,
      reason: "ADMIN_ALREADY_EXISTS",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        fullName: existingUser.fullName,
        role: existingUser.role,
        status: existingUser.status,
        avatarUrl: existingUser.avatarUrl,
        bio: existingUser.bio,
        createdAt: existingUser.createdAt,
      },
    };
  }

  // Validate password policy
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      bootstrapped: false,
      reason: "PASSWORD_POLICY_VIOLATION",
      error: passwordValidation.error,
    };
  }

  // Securely hash password with Argon2id
  const passwordHash = await hasher.hash(password);

  // Insert initial superadmin user
  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  return {
    bootstrapped: true,
    reason: "SUCCESS",
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      status: newUser.status,
      avatarUrl: newUser.avatarUrl,
      bio: newUser.bio,
      createdAt: newUser.createdAt,
    },
  };
}
