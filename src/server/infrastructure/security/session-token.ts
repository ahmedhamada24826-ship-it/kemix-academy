import crypto from "crypto";

/**
 * Generates a cryptographically secure 32-byte session token encoded as URL-safe base64.
 */
export function generateRawSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Computes a SHA-256 hash of the raw session token.
 * Only this hash is persisted in the PostgreSQL database.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
