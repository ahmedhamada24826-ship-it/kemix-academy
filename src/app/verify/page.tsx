"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KemixLogoIcon } from "@/components/brand/logo";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { ShieldCheck, Search } from "lucide-react";

interface VerificationResult {
  isValid: boolean;
  certificateCode: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  instructorName?: string;
  tools?: string[];
}

export default function VerifyCertificatePage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(code.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "كود الشهادة غير صحيح أو غير مسجل في السجل الرسمي.");
        return;
      }

      setResult(json.data.verification);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التحقق من الشهادة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-14 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-[1536px] space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="cyan" className="font-bold">
            السجل المركزي للشهادات المعتمدة
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            التحقق من صحة شهادة إتمام الكورس
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            تأكد من صحة وموثوقية الشهادات الصادرة لخريجي برامج أكاديمية كيميكس KEMIX Academy.
          </p>
        </div>

        {/* Verification Form Card */}
        <Card className="bg-white border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
              <span>أدخل كود الشهادة أو الرمز المرجعي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="مثال: KEMIX-2026-XXXX-YYYY"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 font-mono text-sm dir-ltr text-left"
                  required
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0B2D5B] hover:bg-[#2563EB] text-white font-bold px-6"
                >
                  {isLoading ? (
                    "جاري التحقق..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span>التحقق من الشهادة</span>
                    </span>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-400">
                يمكنك العثور على كود التحقق الفريد في أسفل شهادة إتمام الكورس المعتمدة.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verified Result Card */}
        {result && (
          <CertificateDocument certificate={result} />
          /*
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 px-6 py-3 text-white flex items-center justify-between text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>شهادة معتمدة موثقة رسمياً</span>
              </div>
              <span className="font-mono dir-ltr">{result.certificateCode}</span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <KemixLogoIcon className="h-12 w-12" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">أكاديمية كيميكس (KEMIX Academy)</h3>
                  <p className="text-xs text-slate-500">
                    شهادة إتمام وتخرج رقمية رسمية
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    اسم الخريج / المتدرب
                  </span>
                  <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>{result.recipientName}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    الكورس المكتمل
                  </span>
                  <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span>{result.courseTitle}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    تاريخ الإصدار
                  </span>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {new Date(result.issuedAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    حالة التحقق في السجل
                  </span>
                  <Badge variant="success" className="w-fit text-xs font-bold">
                    نشطة وموثقة بالسجل الرسمي
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card> */
        )}
      </div>
    </div>
  );
}
