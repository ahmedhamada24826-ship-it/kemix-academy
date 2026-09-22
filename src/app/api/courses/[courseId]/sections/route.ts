import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { sectionService } from "@/server/application/sections/section.service";
import {
  CreateSectionSchema,
  ReorderSectionsSchema,
} from "@/server/domain/sections/section-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    const sections = await sectionService.listSections(courseId, user);
    return apiSuccess({ sections }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list sections";
    if (message.includes("not found") || message.includes("access denied")) {
      return apiError("NOT_FOUND", "Course not found", 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = CreateSectionSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid section input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const section = await sectionService.createSection(courseId, user, parseResult.data);
    return apiSuccess({ section }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create section";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function PUT(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();
    const parseResult = ReorderSectionsSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid section reorder input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const sections = await sectionService.reorderSections(courseId, user, parseResult.data);
    return apiSuccess({ sections }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reorder sections";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
