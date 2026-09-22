import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { platformSettingsService } from "@/server/application/settings/settings.service";
import { UpdatePlatformSettingsSchema } from "@/server/domain/settings/settings-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET() {
  try {
    const settings = await platformSettingsService.getSettings();
    return apiSuccess({ settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    return apiError("SETTINGS_FETCH_ERROR", message, 400);
  }
}

async function updateSettingsFromRequest(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await req.json();
  const validation = UpdatePlatformSettingsSchema.safeParse(body);

  if (!validation.success) {
    return apiError(
      "VALIDATION_ERROR",
      validation.error.errors[0]?.message || "Invalid settings data",
      422,
      validation.error.flatten()
    );
  }

  const settings = await platformSettingsService.updateSettings(user, validation.data);
  return apiSuccess({ settings });
}

export async function PATCH(req: NextRequest) {
  try {
    return await updateSettingsFromRequest(req);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    const status = message.includes("Forbidden") ? 403 : 400;
    return apiError("SETTINGS_UPDATE_ERROR", message, status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    return await updateSettingsFromRequest(req);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    const status = message.includes("Forbidden") ? 403 : 400;
    return apiError("SETTINGS_UPDATE_ERROR", message, status);
  }
}
