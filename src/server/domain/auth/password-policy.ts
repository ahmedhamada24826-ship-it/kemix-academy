import { z } from "zod";

/**
 * LMS Password Policy Requirements:
 * - Minimum 8 characters, maximum 128 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 * - At least one special symbol (!@#$%^&*...)
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a plaintext password candidate against the platform policy.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message ?? "Invalid password",
    };
  }
  return { valid: true };
}
