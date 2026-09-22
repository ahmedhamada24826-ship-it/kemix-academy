"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/upload/file-dropzone";
import type { UploadedAsset } from "@/components/upload/use-uploader";
import {
  HardDrive,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  Film,
  CheckCircle2,
  Copy,
  Trash2,
} from "lucide-react";

interface MediaFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  visibility: "PUBLIC" | "PROTECTED";
  createdAt: string;
  publicUrl?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, unitIndex)).toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

export default function AdminMediaPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/files");
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.error?.message || "تعذر تحميل الملفات");
      }
      setFiles(json.data?.files || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الملفات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploaded = async (_asset: UploadedAsset) => {
    await loadFiles();
  };

  const handleDelete = async (file: MediaFile) => {
    if (!window.confirm(`هل أنت متأكد من حذف الملف "${file.originalName}"؟`)) return;

    const response = await fetch(`/api/files/${file.id}/access`, { method: "DELETE" });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      setError(json?.error?.message || "تعذر حذف الملف");
      return;
    }
    await loadFiles();
  };

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
      <Card className="bg-white border border-blue-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">رفع صورة أو ملف</h2>
            <p className="text-xs text-slate-500">يتم رفع الملف مباشرة إلى التخزين ثم تسجيله في قاعدة البيانات.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FileDropzone
            category="IMAGE"
            visibility="PUBLIC"
            maxSizeMb={10}
            accept={["image/*"]}
            label="رفع صورة"
            hint="PNG, JPG, WebP أو SVG حتى 10MB"
            onUploaded={handleUploaded}
          />
          <FileDropzone
            category="OTHER"
            visibility="PROTECTED"
            maxSizeMb={200}
            label="رفع ملف"
            hint="ملفات الدروس والبيانات حتى 200MB"
            onUploaded={handleUploaded}
          />
        </div>
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
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
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">جاري تحميل الملفات...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد ملفات مرفوعة بعد.</td></tr>
              ) : files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                        {file.category === "IMAGE" ? (
                          <UploadCloud className="h-4 w-4 text-blue-600" />
                        ) : file.mimeType.includes("spreadsheet") || file.mimeType.includes("csv") ? (
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        ) : file.mimeType.includes("notebook") ? (
                          <FileCode className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Film className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 font-mono text-xs">{file.originalName}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {file.category}
                    </Badge>
                  </td>

                  <td className="p-4 font-mono text-xs text-slate-600">
                    {formatBytes(file.size)}
                  </td>

                  <td className="p-4 text-slate-500 text-xs font-mono">
                    {new Date(file.createdAt).toLocaleDateString("ar-EG")}
                  </td>

                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(file.publicUrl || `/api/files/${file.id}/access?redirect=1`)}
                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copiedUrl === (file.publicUrl || `/api/files/${file.id}/access?redirect=1`) ? (
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
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(file)} className="h-7 px-2 text-red-600 hover:text-red-800" title="حذف الملف">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    </div>
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
