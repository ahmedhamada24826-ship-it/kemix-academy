import { z } from "zod";

export const EnrollmentStatusEnum = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);
export const EnrollmentTypeEnum = z.enum([
  "FREE_ENROLLMENT",
  "ADMIN_ASSIGNED",
  "PURCHASED",
]);

export const SelfEnrollSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
});

export const AdminAssignEnrollmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  courseId: z.string().uuid("Invalid course ID format"),
  enrollmentType: EnrollmentTypeEnum.default("ADMIN_ASSIGNED"),
});

export const EnrollmentQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: EnrollmentStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SelfEnrollSchemaType = z.infer<typeof SelfEnrollSchema>;
export type AdminAssignEnrollmentSchemaType = z.infer<typeof AdminAssignEnrollmentSchema>;
export type EnrollmentQuerySchemaType = z.infer<typeof EnrollmentQuerySchema>;
