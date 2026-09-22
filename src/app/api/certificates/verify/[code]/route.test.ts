import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { certificateService } from "@/server/application/certificates/certificate.service";

vi.mock("@/server/application/certificates/certificate.service", () => ({
  certificateService: {
    verifyCertificate: vi.fn(),
  },
}));

describe("API /api/certificates/verify/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns certificate verification info for valid code", async () => {
    vi.mocked(certificateService.verifyCertificate).mockResolvedValue({
      isValid: true,
      certificateCode: "KEMIX-2026-ABCD",
      recipientName: "Jane Doe",
      courseTitle: "Power BI for Business Analysts",
      issuedAt: new Date("2026-09-19T00:00:00.000Z"),
    });

    const req = new NextRequest("http://localhost:3000/api/certificates/verify/KEMIX-2026-ABCD");
    const res = await GET(req, {
      params: Promise.resolve({ code: "KEMIX-2026-ABCD" }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.verification.recipientName).toBe("Jane Doe");
  });

  it("returns 404 for invalid certificate code", async () => {
    vi.mocked(certificateService.verifyCertificate).mockRejectedValue(
      new Error("Invalid or unverified certificate code")
    );

    const req = new NextRequest("http://localhost:3000/api/certificates/verify/INVALID");
    const res = await GET(req, {
      params: Promise.resolve({ code: "INVALID" }),
    });

    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
