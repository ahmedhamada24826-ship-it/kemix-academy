import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { SessionCookieOptions } from "@/config/session";

/**
 * Creates a standard successful API response with optional Set-Cookie header.
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  cookieOptions?: SessionCookieOptions
): NextResponse<ApiResponse<T>> {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  const response = NextResponse.json(body, { status });

  if (cookieOptions) {
    response.cookies.set(cookieOptions.name, cookieOptions.value, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      expires: cookieOptions.expires,
    });
  }

  return response;
}

/**
 * Creates a standard error API response with optional Set-Cookie header.
 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  cookieOptions?: SessionCookieOptions
): NextResponse<ApiResponse<never>> {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  const response = NextResponse.json(body, { status });

  if (cookieOptions) {
    response.cookies.set(cookieOptions.name, cookieOptions.value, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      expires: cookieOptions.expires,
    });
  }

  return response;
}
