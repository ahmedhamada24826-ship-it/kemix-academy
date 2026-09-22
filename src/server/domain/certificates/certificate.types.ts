export interface CertificateDto {
  id: string;
  certificateCode: string;
  userId: string;
  courseId: string;
  issuedAt: Date;
  verificationToken: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    fullName: string;
  };
}

export interface CertificateVerificationDto {
  isValid: boolean;
  certificateCode: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: Date;
  instructorName?: string;
  tools?: string[];
}

export interface ClaimCertificateInput {
  courseId: string;
}
