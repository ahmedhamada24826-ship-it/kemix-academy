import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { platformSettingsService } from "@/server/application/settings/settings.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";
import { z } from "zod";

const BuildWhatsAppUrlSchema = z.object({
  courseName: z.string().trim().min(1).max(200),
  price: z.coerce.number().min(0),
  currency: z.string().trim().min(2).max(10),
  studentName: z.string().trim().min(1).max(120),
  studentEmail: z.string().trim().email(),
  studentPhone: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validation = BuildWhatsAppUrlSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid request data",
        422,
        validation.error.flatten()
      );
    }

    const result = await platformSettingsService.buildWhatsAppUrl(validation.data);
    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to build WhatsApp URL";
    return apiError("WHATSAPP_URL_ERROR", message, 400);
  }
}
