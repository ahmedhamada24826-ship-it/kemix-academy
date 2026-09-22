import { z } from "zod";

export const ClaimCertificateSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
});

export const VerifyCertificateSchema = z.object({
  code: z.string().trim().min(3, "Certificate code is required"),
});

export type ClaimCertificateSchemaType = z.infer<typeof ClaimCertificateSchema>;
export type VerifyCertificateSchemaType = z.infer<typeof VerifyCertificateSchema>;
