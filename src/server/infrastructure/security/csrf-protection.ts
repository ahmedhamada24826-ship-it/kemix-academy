import { env } from "@/lib/env";

/**
 * Validates request origin against the configured application URL.
 * Provides defense-in-depth against Cross-Site Request Forgery (CSRF).
 */
export function validateSameOrigin(originHeader: string | null, refererHeader: string | null): boolean {
  if (process.env.NODE_ENV === "test") return true;

  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
  const targetHost = appUrl.host;

  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      return originUrl.host === targetHost;
    } catch {
      return false;
    }
  }

  if (refererHeader) {
    try {
      const refUrl = new URL(refererHeader);
      return refUrl.host === targetHost;
    } catch {
      return false;
    }
  }

  // If both are missing on mutating methods, fail closed
  return false;
}
