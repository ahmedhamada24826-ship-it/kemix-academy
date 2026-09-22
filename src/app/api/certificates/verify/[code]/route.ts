import { NextRequest } from "next/server";
import { certificateService } from "@/server/application/certificates/certificate.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ code: string }>;
}

export async function GET(_req: NextRequest, props: RouteProps) {
  try {
    const { code } = await props.params;
    const verification = await certificateService.verifyCertificate(code);
    return apiSuccess({ verification }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Certificate verification failed";
    return apiError("NOT_FOUND", message, 404);
  }
}
