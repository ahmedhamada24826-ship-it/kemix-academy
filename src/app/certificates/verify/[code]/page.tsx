import { redirect } from "next/navigation";

export default async function CertificateVerificationAlias({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/verify/${encodeURIComponent(code)}`);
}
