import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { certificateService } from "@/server/application/certificates/certificate.service";
import { ClaimCertificateSchema } from "@/server/domain/certificates/certificate-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const targetUserId =
      user.role === "ADMIN" && req.nextUrl.searchParams.get("userId")
        ? req.nextUrl.searchParams.get("userId")!
        : user.id;

    const certificates = await certificateService.getUserCertificates(targetUserId);
    return apiSuccess({ certificates }, 200);
  } catch (err) {
    console.error("❌ /api/certificates GET failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve certificates", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = ClaimCertificateSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid claim certificate input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const certificate = await certificateService.claimCertificate(
      user.id,
      parseResult.data.courseId
    );

    return apiSuccess({ certificate }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to claim certificate";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("requirements not met") || message.includes("enrolled") || message.includes("not enabled")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const certificateId = req.nextUrl.searchParams.get("id");
    if (!certificateId) {
      return apiError("VALIDATION_ERROR", "Certificate id is required", 400);
    }

    await certificateService.deleteCertificate(certificateId, user);
    return apiSuccess({ message: "Certificate deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete certificate";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
