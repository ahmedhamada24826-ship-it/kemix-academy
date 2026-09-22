"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Award,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";

interface CertificateItem {
  id: string;
  certificateCode: string;
  studentId: string;
  courseId: string;
  issueDate: string;
  student: {
    fullName: string;
    email: string;
  };
  course: {
    title: string;
  };
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCertificates() {
      try {
        const res = await fetch("/api/certificates");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.certificates) {
            setCertificates(json.data.certificates);
          }
        }
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCertificates();
  }, []);

  const filtered = certificates.filter(
    (c) =>
      c.certificateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Award className="h-6 w-6 text-[#2563EB]" />
          <span>سجل الشهادات الرقمية المعتمدة</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          إدارة والتحقق من الشهادات الصادرة لخريجي كورسات أكاديمية كيميكس.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <Input
          type="text"
          placeholder="ابحث بكود الشهادة، اسم الخريج، أو عنوان الكورس..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm h-8"
        />
      </div>

      {/* Certificates Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">كود الشهادة الفريد</th>
                <th className="p-4">الخريج</th>
                <th className="p-4">الكورس المكتمل</th>
                <th className="p-4">تاريخ الإصدار</th>
                <th className="p-4 text-left">رابط التحقق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse font-medium">
                    جاري تحميل سجل الشهادات...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا توجد شهادات مصدرة مسجلة بعد.
                  </td>
                </tr>
              ) : (
                filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-700 text-xs dir-ltr text-right">
                      {cert.certificateCode}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900">{cert.student?.fullName || "خريج"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{cert.student?.email}</p>
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {cert.course?.title}
                    </td>

                    <td className="p-4 text-slate-500 text-xs font-mono">
                      {new Date(cert.issueDate).toLocaleDateString("ar-EG")}
                    </td>

                    <td className="p-4 text-left">
                      <Link
                        href={`/certificates/verify/${encodeURIComponent(cert.certificateCode)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 ml-1" />
                        <span>معاينة والتحقق</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
