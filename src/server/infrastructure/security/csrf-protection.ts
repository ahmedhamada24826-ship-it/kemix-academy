import { env } from "@/lib/env";

/**
 * Validates request origin against the configured application URL,
 * the incoming host headers, or Vercel deployment domains.
 * Provides defense-in-depth against Cross-Site Request Forgery (CSRF).
 */
export function validateSameOrigin(
  originHeader: string | null,
  refererHeader: string | null,
  hostHeader?: string | null
): boolean {
  if (process.env.NODE_ENV === "test") return true;

  // Extract candidate origin/referer host
  let candidateHost: string | null = null;
  if (originHeader) {
    try {
      candidateHost = new URL(originHeader).host.toLowerCase();
    } catch {
      return false;
    }
  } else if (refererHeader) {
    try {
      candidateHost = new URL(refererHeader).host.toLowerCase();
    } catch {
      return false;
    }
  }

  // If both origin and referer are absent, fail closed
  if (!candidateHost) {
    return false;
  }

  const allowedHosts = new Set<string>();

  // 1. Configured NEXT_PUBLIC_APP_URL
  if (env.NEXT_PUBLIC_APP_URL) {
    try {
      allowedHosts.add(new URL(env.NEXT_PUBLIC_APP_URL).host.toLowerCase());
    } catch {
      // ignore
    }
  }

  // 2. Incoming request Host / X-Forwarded-Host
  if (hostHeader) {
    allowedHosts.add(hostHeader.toLowerCase().trim());
  }

  // 3. Vercel environment variables
  if (process.env.VERCEL_URL) {
    allowedHosts.add(process.env.VERCEL_URL.toLowerCase().trim());
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    allowedHosts.add(process.env.NEXT_PUBLIC_VERCEL_URL.toLowerCase().trim());
  }

  // Exact match with any known host
  if (allowedHosts.has(candidateHost)) {
    return true;
  }

  // 4. In development, allow any localhost / 127.0.0.1 port
  if (process.env.NODE_ENV === "development") {
    if (
      candidateHost.startsWith("localhost") ||
      candidateHost.startsWith("127.0.0.1") ||
      candidateHost.startsWith("0.0.0.0")
    ) {
      return true;
    }
  }

  // 5. Allow Vercel preview and production deployments (*.vercel.app)
  if (candidateHost.endsWith(".vercel.app")) {
    return true;
  }

  return false;
}

