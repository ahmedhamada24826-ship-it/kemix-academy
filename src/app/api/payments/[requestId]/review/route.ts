import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { paymentService } from "@/server/application/payments/payment.service";
import { ReviewPaymentRequestSchema } from "@/server/domain/payments/payment-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validation = ReviewPaymentRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid review data",
        422,
        validation.error.flatten()
      );
    }

    const request = await paymentService.reviewPaymentRequest(requestId, user, validation.data);
    return apiSuccess({ request });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review payment request";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("PAYMENT_REVIEW_ERROR", message, status);
  }
}
