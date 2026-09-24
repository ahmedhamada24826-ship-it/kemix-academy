"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { CalendarDays, Download, Linkedin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KemixLogoIcon } from "@/components/brand/logo";

export interface CertificateDocumentData {
  certificateCode: string;
  recipientName: string;
  courseTitle: string;
  instructorName?: string;
  issuedAt: string;
  tools?: string[];
}

interface CertificateDocumentProps {
  certificate: CertificateDocumentData;
  showActions?: boolean;
}

export function CertificateDocument({ certificate, showActions = true }: CertificateDocumentProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const certificateRef = useRef<HTMLElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const verificationPath = `/certificates/verify/${encodeURIComponent(certificate.certificateCode)}`;

  const addToLinkedIn = () => {
    const issuedDate = new Date(certificate.issuedAt);
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: certificate.courseTitle,
      organizationName: "KEMIX Academy",
      issueYear: String(issuedDate.getFullYear()),
      issueMonth: String(issuedDate.getMonth() + 1),
      certId: certificate.certificateCode,
      certUrl: `${window.location.origin}${verificationPath}`,
    });

    window.open(
      `https://www.linkedin.com/profile/add?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const downloadAsImage = async () => {
    if (!certificateRef.current || isDownloading) return;
    setIsDownloading(true);
    certificateRef.current.classList.add("certificate-exporting");
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const dataUrl = await toPng(certificateRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1536,
        height: 1024,
        style: { width: "1536px", height: "1024px" },
      });
      const link = document.createElement("a");
      link.download = `kemix-certificate-${certificate.certificateCode}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      certificateRef.current.classList.remove("certificate-exporting");
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const verificationUrl = `${window.location.origin}${verificationPath}`;
    QRCode.toDataURL(verificationUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0B2D5B", light: "#FFFFFF" },
    }).then(setQrCode).catch(() => setQrCode(null));
  }, [verificationPath]);

  return (
    <div className="certificate-shell" dir="ltr">
      {showActions && (
        <div className="certificate-actions" aria-label="Certificate actions">
          <Button type="button" onClick={() => window.print()} className="bg-[#0B2D5B] hover:bg-[#2563EB]">
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </Button>
          <Button
            type="button"
            onClick={addToLinkedIn}
            className="bg-[#0A66C2] hover:bg-[#004182]"
            aria-label="Add certificate to LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
            <span>Add to LinkedIn</span>
          </Button>
          <Button
            type="button"
            onClick={downloadAsImage}
            disabled={isDownloading}
            className="bg-[#0F766E] hover:bg-[#115E59]"
            aria-label="Download certificate as image"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? "Preparing image..." : "Download image"}</span>
          </Button>
        </div>
      )}

      <article ref={certificateRef} className="certificate-document" aria-label="KEMIX Academy Certificate of Completion">
        <div className="certificate-corner certificate-corner-top" aria-hidden="true" />
        <div className="certificate-corner certificate-corner-bottom" aria-hidden="true" />
        <div className="certificate-watermark" aria-hidden="true">
          <KemixLogoIcon className="h-full w-full" />
        </div>
        <div className="certificate-inner-border" aria-hidden="true" />

        <div className="certificate-topline">Learn <span>•</span> Build <span>•</span> Grow</div>

        <header className="certificate-header">
          <div className="certificate-logo-lockup">
            <img
              src="/certificate-logo.png"
              alt="KEMIX Academy"
              className="certificate-logo-image"
            />
          </div>
          <h1>CERTIFICATE <span>OF</span> COMPLETION</h1>
          <div className="certificate-divider"><i /> <b /> <i /></div>
        </header>

        <main className="certificate-main">
          <p className="certificate-kicker">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>
          <h2>{certificate.recipientName}</h2>
          <div className="certificate-divider certificate-divider-small"><i /> <b /> <i /></div>
          <p className="certificate-kicker certificate-course-kicker">FOR SUCCESSFULLY COMPLETING</p>
          <h3>{certificate.courseTitle}</h3>
          {(certificate.tools?.length ?? 0) > 0 && (
            <p className="certificate-tools">{certificate.tools?.join("  •  ")}</p>
          )}
          <p className="certificate-statement">
            This certificate acknowledges that the above student has successfully<br />
            completed all requirements and demonstrated the necessary skills<br />
            and knowledge in the mentioned course.
          </p>
        </main>

        <footer className="certificate-footer">
          <div className="certificate-meta">
            <div className="certificate-date"><CalendarDays />
              <div><span>ISSUED ON</span><strong>{new Date(certificate.issuedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</strong></div>
            </div>
            <div className="certificate-meta-rule" />
            <span className="certificate-label">CERTIFICATE ID</span>
            <strong className="certificate-code">{certificate.certificateCode}</strong>
            <div className="certificate-footer-motto">Learn <span>•</span> Build <span>•</span> Grow</div>
          </div>

          <div className="certificate-seal" aria-label="KEMIX Academy official seal">
            <div className="certificate-seal-ring"><KemixLogoIcon variant="white" className="h-14 w-14" /><strong>KEMIX</strong><span>ACADEMY</span></div>
            <div className="certificate-ribbon certificate-ribbon-left" />
            <div className="certificate-ribbon certificate-ribbon-right" />
          </div>

          <div className="certificate-signature">
            <div className="signature-mark">Ahmed Hamada</div>
            <div className="signature-rule" />
            <strong>Ahmed Hamada</strong>
            <span>CEO &amp; Founder</span>
            <span>KEMIX Academy</span>
          </div>

          <div className="certificate-signature instructor-signature">
            <div className="signature-mark">{certificate.instructorName || "Course Instructor"}</div>
            <div className="signature-rule" />
            <span>Course Instructor</span>
            <strong>{certificate.instructorName || "Course Instructor"}</strong>
          </div>

          <div className="certificate-qr">
            {qrCode ? <img src={qrCode} alt="Certificate verification QR code" /> : <div className="certificate-qr-placeholder" />}
          </div>
        </footer>
      </article>
    </div>
  );
}
