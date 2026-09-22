import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { sectionService } from "@/server/application/sections/section.service";
import { UpdateSectionSchema } from "@/server/domain/sections/section-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ sectionId: string }>;
}

export async function PATCH(req: NextRequest, props: RouteProps) {
  try {
    const { sectionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = UpdateSectionSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid section update input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const section = await sectionService.updateSection(sectionId, user, parseResult.data);
    return apiSuccess({ section }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update section";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { sectionId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await sectionService.deleteSection(sectionId, user);
    return apiSuccess({ message: "Section deleted successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete section";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
