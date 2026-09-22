import { z } from "zod";

/**
 * Normalizes an email address consistently across the platform:
 * - Trims leading and trailing whitespace
 * - Converts all characters to lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Zod schema for validated, normalized email addresses.
 * Preprocesses input with whitespace trimming and lowercasing before email validation.
 */
export const emailSchema = z.preprocess(
  (val) => (typeof val === "string" ? normalizeEmail(val) : val),
  z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .max(255, "Email must not exceed 255 characters")
    .email("Invalid email address format")
);
