import {
  PaymentRequestDto,
  CreatePaymentRequestInput,
  ReviewPaymentRequestInput,
  PaymentRequestFilterParams,
} from "@/server/domain/payments/payment.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IPaymentService {
  createPaymentRequest(
    user: AuthenticatedUser,
    input: CreatePaymentRequestInput
  ): Promise<{ request: PaymentRequestDto; whatsappUrl: string }>;
  listPaymentRequests(
    user: AuthenticatedUser,
    params: PaymentRequestFilterParams
  ): Promise<{ requests: PaymentRequestDto[]; total: number; page: number; limit: number }>;
  getPaymentRequestById(requestId: string, user: AuthenticatedUser): Promise<PaymentRequestDto>;
  reviewPaymentRequest(
    requestId: string,
    user: AuthenticatedUser,
    input: ReviewPaymentRequestInput
  ): Promise<PaymentRequestDto>;
}
