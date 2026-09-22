import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { paymentService } from "@/server/application/payments/payment.service";
import { CreatePaymentRequestSchema } from "@/server/domain/payments/payment-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | undefined;
    const courseId = searchParams.get("courseId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await paymentService.listPaymentRequests(user, {
      status,
      courseId,
      search,
      page,
      limit,
    });

    return apiSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payment requests";
    const status = message.includes("Forbidden") ? 403 : 400;
    return apiError("PAYMENT_REQUESTS_FETCH_ERROR", message, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validation = CreatePaymentRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        "VALIDATION_ERROR",
        validation.error.errors[0]?.message || "Invalid payment request data",
        422,
        validation.error.flatten()
      );
    }

    const result = await paymentService.createPaymentRequest(user, validation.data);
    return apiSuccess(result, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create payment request";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError("PAYMENT_REQUEST_CREATE_ERROR", message, status);
  }
}
