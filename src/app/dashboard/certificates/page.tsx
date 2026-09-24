"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle2, ExternalLink } from "lucide-react";

interface CertificateItem {
  id: string;
  certificateCode: string;
  issuedAt: string;
  course: {
    id: string;
    title: string;
  };
}

export default function StudentCertificatesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCertificates() {
    try {
      const res = await fetch("/api/certificates");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.certificates) {
          setCertificates(data.data.certificates);
        }
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;

    setDeletingId(certificateId);
    try {
      const res = await fetch(`/api/certificates?id=${encodeURIComponent(certificateId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || "فشل حذف الشهادة");
      }

      await loadCertificates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل حذف الشهادة");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadCertificates();
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto max-w-5xl py-10 px-4 space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-1/4 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-slate-200 rounded-xl" />
          <div className="h-36 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0B2D5B]">شهاداتي المعتمدة</h1>
            <p className="text-xs text-slate-500 mt-1">
              جميع الشهادات الرسمية الممنوحة لك مع روابط التحقق العامة ورمز التحقق المشفر.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              العودة للوحة دراستي
            </Button>
          </Link>
        </div>

        {certificates.length === 0 ? (
          <Card className="bg-white border-slate-200 p-8 text-center space-y-3">
            <Award className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">لا توجد شهادات صادرة بعد</h3>
            <p className="text-xs text-slate-500">
              أكمل محاضرات وتكليفات واختبارات الكورس بنسبة 100% لإصدار شهادتك الرسمية.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <Card key={cert.id} className="bg-white border-emerald-200/80 shadow-sm hover:border-emerald-400 transition-all">
                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> شهادة معتمدة موثقة
                    </span>
                    <span className="font-mono text-slate-500">{cert.certificateCode}</span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {cert.course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-1 space-y-4">
                  <p className="text-xs text-slate-500">
                    تاريخ الإصدار: {new Date(cert.issuedAt).toLocaleDateString("ar-EG")}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/verify/${encodeURIComponent(cert.certificateCode)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <span>عرض صفحة التحقق الرسمية</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingId === cert.id}
                      onClick={() => void handleDeleteCertificate(cert.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold"
                    >
                      {deletingId === cert.id ? "جارٍ الحذف..." : "حذف الشهادة"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
