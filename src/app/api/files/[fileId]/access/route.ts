import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { fileService } from "@/server/application/files/file.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ fileId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { fileId } = await props.params;
    const user = await getCurrentUser(req);
    const result = await fileService.getSignedAccessUrl(fileId, user);

    // Plain browser links (<a href>) can request a real navigation/stream instead
    // of a JSON envelope, so downloads open the file rather than printing JSON.
    if (req.nextUrl.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(result.url, 302);
    }

    return apiSuccess(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to access file";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Authentication required")) {
      return apiError("UNAUTHENTICATED", message, 401);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { fileId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await fileService.deleteFileAsset(fileId, user);
    return apiSuccess({ message: "File asset deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete file asset";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
