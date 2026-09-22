# ADR-002: Future Mobile & API Client Compatibility

**Status:** Accepted  
**Date:** 2026-09-19  
**Phase:** 2.2.3 — Authentication Foundation  
**Context:** KEMIX Academy Phase 2 MVP is a web application. However, the authentication architecture must be designed so that native mobile apps (iOS/Android), CLI tools, or third-party API consumers can be supported in future phases without refactoring the core auth system.

---

## Current Architecture (Phase 2 — Web Only)

The Phase 2 authentication system is cookie-based:

```
Browser → POST /api/auth/login → Set-Cookie: session_token=<rawToken>; HttpOnly; SameSite=Lax
Browser → GET /api/auth/me    → reads Cookie header automatically
Browser → POST /api/auth/logout → clears cookie
```

Session tokens are:
- **Stored in PostgreSQL** (`sessions` table, `tokenHash` column — SHA-256 of raw token)
- **Transmitted in HttpOnly cookies** (inaccessible to JavaScript, resistant to XSS)
- **Validated server-side** on every protected request via `authService.getAuthenticatedUser()`

---

## Mobile & API Client Compatibility Decision

### Decision: No Architecture Changes Required

The existing session token system is **fully compatible with mobile apps** through one of two patterns:

---

### Pattern A: Bearer Token (Recommended for native mobile apps)

Mobile clients (React Native, Swift, Kotlin) cannot use HttpOnly cookies easily. Instead, they send the raw session token as a **`Bearer` token in the `Authorization` header**:

```http
GET /api/auth/me HTTP/1.1
Authorization: Bearer <rawSessionToken>
```

**Implementation required (Phase 3 or when needed):**

1. Extend `extractTokenFromCookieHeader()` in `auth-guard.ts` to also check `Authorization: Bearer <token>`:

```typescript
// Future extension to auth-guard.ts
export function extractTokenFromRequest(req: Request): string | null {
  // 1. Try Authorization: Bearer header (mobile/API clients)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // 2. Fall back to Cookie header (browser clients)
  return extractTokenFromCookieHeader(req.headers.get("cookie"));
}
```

2. Mobile clients store the raw session token securely using platform keychain (iOS `Keychain Services`, Android `EncryptedSharedPreferences`).

3. CSRF is **not applicable** to Bearer token requests (tokens are not automatically attached by browsers, so cross-site attacks cannot forge them).

4. No changes to `AuthService`, `Session` model, or database schema are needed.

---

### Pattern B: Separate API Key System (Recommended for CI/CD, server-to-server integrations)

For programmatic API consumers (not human users), a dedicated API key table can be added in Phase 3:

```sql
-- Proposed future schema addition
model ApiKey {
  id          String   @id @default(uuid())
  userId      String
  keyHash     String   @unique  -- SHA-256 of the raw key
  name        String            -- human-readable label (e.g. "Postman Testing")
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?
  revokedAt   DateTime?

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

This is a **Phase 3+ concern** and is completely independent of the core session architecture.

---

## Rate Limiting & Mobile Clients

The current in-memory rate limiter (`MemoryRateLimiter`) uses **client IP** as the primary key for login/register/forgot-password rate limits. Mobile clients will hit the same IP-based limits.

**Future consideration:** For mobile apps behind carrier NAT (many clients sharing one IP), switch to user-key-based limiting after the first successful authentication. The `IRateLimiter` interface allows a zero-friction swap to a Redis-backed rate limiter when horizontal scaling requires it.

---

## Session Storage Compatibility

| Client Type | Token Transport | Cookie Required | Changes Needed |
|-------------|----------------|-----------------|----------------|
| Web browser (current) | HttpOnly Cookie | Yes | None |
| Mobile app (future) | `Authorization: Bearer` header | No | Add bearer extraction in `auth-guard.ts` |
| CI/CD / server API | API Key (future) | No | New `ApiKey` model + service |
| Headless browser / Playwright | Cookie (test) | Yes | None |

---

## CORS Configuration (Required Before Mobile Launch)

When native mobile apps call the API from different origins, CORS headers must be explicitly configured in Next.js:

```typescript
// next.config.ts — to be added before mobile app launch
headers: [
  {
    source: "/api/:path*",
    headers: [
      { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS },
      { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
      { key: "Access-Control-Allow-Credentials", value: "true" },
    ],
  },
],
```

**Note:** `SameSite=Lax` cookie behavior changes with CORS. Mobile apps using Bearer tokens do not need cookies and avoid this complexity entirely.

---

## Consequences

- **No Phase 2 changes required.** The current cookie-based system is production-ready for the web MVP.
- **Phase 3 mobile readiness:** Adding Bearer token support requires a 10-line change to `auth-guard.ts` and no database migrations.
- **API key support** is a clean Phase 3+ addition with its own Prisma migration.
- **The `IAuthService`, `AuthService`, `Session` model, and all existing tests remain completely unchanged** when Bearer token support is added — only the token extraction layer in `auth-guard.ts` changes.
