import { PaymentRequestStatus } from "@/types";

export interface PaymentRequestDto {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  notes: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  reviewedBy?: {
    id: string;
    fullName: string;
  } | null;
}

export interface CreatePaymentRequestInput {
  courseId: string;
  studentPhone?: string;
  notes?: string;
}

export interface ReviewPaymentRequestInput {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export interface UpdatePaymentRequestInput {
  studentPhone: string | null;
}

export interface PaymentRequestFilterParams {
  status?: PaymentRequestStatus;
  courseId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
