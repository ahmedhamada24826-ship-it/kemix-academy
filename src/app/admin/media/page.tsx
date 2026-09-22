"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  HardDrive,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  Film,
  CheckCircle2,
  ExternalLink,
  Copy,
  Search,
} from "lucide-react";

export default function AdminMediaPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const sampleMedia = [
    {
      name: "financial_dataset_2026.parquet",
      type: "DATASET",
      size: "14.2 MB",
      uploadedAt: "2026-09-18",
      url: "https://storage.kemix.academy/datasets/financial_dataset_2026.parquet",
    },
    {
      name: "sales_forecasting_model.ipynb",
      type: "NOTEBOOK",
      size: "2.8 MB",
      uploadedAt: "2026-09-15",
      url: "https://storage.kemix.academy/notebooks/sales_forecasting_model.ipynb",
    },
    {
      name: "intro_to_deep_learning_slides.pdf",
      type: "DOCUMENT",
      size: "8.4 MB",
      uploadedAt: "2026-09-10",
      url: "https://storage.kemix.academy/slides/intro_to_deep_learning_slides.pdf",
    },
  ];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-[#2563EB]" />
          <span>مركز الوسائط والملفات السحابية</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          رفع وإدارة مجموعات البيانات التدريبية (.csv, .parquet)، دفاتر Jupyter Notebooks، والملفات المرفقة.
        </p>
      </div>

      {/* Upload Box */}
      <Card className="bg-white border-2 border-dashed border-blue-200 shadow-sm p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            اسحب الملفات هنا أو اضغط للاستعراض
          </h2>
          <p className="text-xs text-slate-500">
            يدعم ملفات البيانات (CSV, JSON, Parquet, SQLite) والدفاتر (IPYNB, PDF, ZIP) حتى 200 ميجابايت.
          </p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold h-9">
          اختيار ملف من الجهاز
        </Button>
      </Card>

      {/* Media Files Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">الملفات المرفوعة مؤخراً</CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            S3 Object Store Active
          </Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">اسم الملف</th>
                <th className="p-4">النوع</th>
                <th className="p-4">الحجم</th>
                <th className="p-4">تاريخ الرفع</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleMedia.map((file, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                        {file.type === "DATASET" ? (
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        ) : file.type === "NOTEBOOK" ? (
                          <FileCode className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Film className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 font-mono text-xs">{file.name}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {file.type}
                    </Badge>
                  </td>

                  <td className="p-4 font-mono text-xs text-slate-600">
                    {file.size}
                  </td>

                  <td className="p-4 text-slate-500 text-xs font-mono">
                    {file.uploadedAt}
                  </td>

                  <td className="p-4 text-left">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(file.url)}
                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copiedUrl === file.url ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>تم النسخ!</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3.5 w-3.5 ml-1" />
                          <span>نسخ الرابط</span>
                        </span>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
