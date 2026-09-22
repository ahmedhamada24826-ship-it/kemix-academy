import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { fileService } from "@/server/application/files/file.service";
import { RegisterFileAssetSchema } from "@/server/domain/files/file-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = RegisterFileAssetSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid file asset registration data",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const fileAsset = await fileService.registerFileAsset(user, parseResult.data);
    return apiSuccess({ fileAsset }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register file asset";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("does not belong") || message.includes("courseId is required")) {
      return apiError("INVALID_ATTACHMENT_SCOPE", message, 422);
    }
    if (message.includes("storage") || message.includes("bucket")) {
      return apiError("STORAGE_ERROR", message, 502);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
