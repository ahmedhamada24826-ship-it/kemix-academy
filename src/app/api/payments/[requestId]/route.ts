import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { paymentService } from "@/server/application/payments/payment.service";
import { UpdatePaymentRequestSchema } from "@/server/domain/payments/payment-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const validation = UpdatePaymentRequestSchema.safeParse(await req.json());
    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid payment request data",
        422,
        validation.error.flatten()
      );
    }

    const request = await paymentService.updatePaymentRequest(requestId, user, validation.data);
    return apiSuccess({ request });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update payment request";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("PAYMENT_REQUEST_UPDATE_ERROR", message, status);
  }
}