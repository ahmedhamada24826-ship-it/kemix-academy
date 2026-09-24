import {
  CertificateDto,
  CertificateVerificationDto,
} from "@/server/domain/certificates/certificate.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface ICertificateService {
  claimCertificate(userId: string, courseId: string): Promise<CertificateDto>;

  verifyCertificate(codeOrToken: string): Promise<CertificateVerificationDto>;

  getUserCertificates(userId: string): Promise<CertificateDto[]>;

  deleteCertificate(certificateId: string, user?: AuthenticatedUser | null): Promise<void>;

  getCertificateById(
    certificateId: string,
    user?: AuthenticatedUser | null
  ): Promise<CertificateDto>;
}
