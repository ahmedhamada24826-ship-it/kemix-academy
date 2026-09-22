"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KemixLogoIcon } from "@/components/brand/logo";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { ArrowRight } from "lucide-react";

interface VerificationResult {
  isValid: boolean;
  certificateCode: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  instructorName?: string;
  tools?: string[];
}

export default function DirectVerifyCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkCode() {
      try {
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(code)}`);
        const json = await res.json();
        if (res.ok && json.success && json.data?.verification) {
          setResult(json.data.verification);
        } else {
          setError(json.error?.message || "كود التحقق غير صحيح أو غير مسجل في السجل الرسمي للشهادات.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء فحص الشهادة");
      } finally {
        setIsLoading(false);
      }
    }
    checkCode();
  }, [code]);

  return (
    <div className="bg-slate-50 min-h-screen py-14 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-[1536px] space-y-8">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          <span>البحث عن شهادة أخرى</span>
        </Link>

        {isLoading ? (
          <Card className="p-8 animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded-xl" />
          </Card>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center py-6">
              <Link href="/verify">
                <Button variant="outline">البحث في السجل العام</Button>
              </Link>
            </div>
          </div>
        ) : result ? (
          <CertificateDocument certificate={result} />
          /* <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 via-white to-white shadow-xl overflow-hidden">
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
                    التحقق الرسمي من شهادة إتمام المسار التدريبي
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">
                    اسم الخريج
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
                    حالة الشهادة
                  </span>
                  <Badge variant="success" className="w-fit text-xs font-bold">
                    معتمدة ومسجلة في قواعد بيانات الأكاديمية
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card> */
        ) : null}
      </div>
    </div>
  );
}
