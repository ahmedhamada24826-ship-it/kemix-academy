import { z } from "zod";

export const CreatePaymentRequestSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  studentPhone: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const ReviewPaymentRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const UpdatePaymentRequestSchema = z.object({
  studentPhone: z.preprocess(
    (value) => (value === null || (typeof value === "string" && value.trim() === "") ? null : value),
    z.string().trim().max(30, "Phone number cannot exceed 30 characters").nullable()
  ),
});

export const PaymentRequestQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  courseId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreatePaymentRequestSchemaType = z.infer<typeof CreatePaymentRequestSchema>;
export type ReviewPaymentRequestSchemaType = z.infer<typeof ReviewPaymentRequestSchema>;
export type UpdatePaymentRequestSchemaType = z.infer<typeof UpdatePaymentRequestSchema>;
export type PaymentRequestQuerySchemaType = z.infer<typeof PaymentRequestQuerySchema>;
