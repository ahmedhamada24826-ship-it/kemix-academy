import { z } from "zod";
import { emailSchema } from "./email-normalizer";
import { passwordSchema } from "./password-policy";

/**
 * Validates login request payload:
 * - email: Valid format, automatically trimmed & converted to lowercase
 * - password: Non-empty string
 * - rememberMe: Optional boolean (defaults to true)
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Validates user registration request payload:
 * - email: Valid format, automatically trimmed & converted to lowercase
 * - password: Enforces full platform password complexity policy
 * - fullName: 2–150 characters, trimmed
 */
export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
