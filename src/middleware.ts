import { NextResponse, type NextRequest } from "next/server";
import { SESSION_CONFIG } from "@/config/session";

/**
 * Lightweight Next.js Edge Middleware
 *
 * Responsibilities:
 * 1. Inject enterprise-grade HTTP security headers across all responses.
 * 2. Early routing filter for protected paths (e.g. /admin/*, /dashboard/*, /instructor/*).
 *
 * NOTE: Cryptographic token verification and RBAC authorization are rigorously
 * enforced server-side inside API routes and Server Components.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;

  // 1. Early gate for protected administrative/dashboard UI routes
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/instructor");

  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Initialize response with standard security headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
