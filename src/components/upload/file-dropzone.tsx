"use client";

import React, { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react";
import {
  useUploader,
  type UploadCategory,
  type UploadVisibility,
  type UploadedAsset,
} from "./use-uploader";

export interface FileDropzoneProps {
  category: UploadCategory;
  visibility?: UploadVisibility;
  courseId?: string;
  lessonId?: string;
  maxSizeMb?: number;
  accept?: string[];
  label: string;
  hint?: string;
  onUploaded: (asset: UploadedAsset) => void;
  className?: string;
}

/**
 * Shared drag & drop / file picker upload widget.
 * Renders live progress, errors, Arabic RTL copy and reuses useUploader().
 */
export function FileDropzone({
  category,
  visibility,
  courseId,
  lessonId,
  maxSizeMb = 200,
  accept,
  label,
  hint,
  onUploaded,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isUploading, progress, error, upload, reset } = useUploader();

  const acceptAttr = accept
    ?.map((rule) => (rule.endsWith("/*") ? rule : rule.startsWith(".") ? rule : rule))
    .join(",");

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const asset = await upload(file, {
      category,
      visibility,
      courseId,
      lessonId,
      maxSizeMb,
      accept,
    });
    if (asset) onUploaded(asset);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!isUploading) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-[#2563EB] bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50",
          isUploading && "opacity-70 cursor-wait"
        )}
      >
        <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UploadCloud className="h-5 w-5" />
          )}
        </div>
        <p className="text-xs font-bold text-slate-800">{label}</p>
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
        <p className="text-[10px] text-slate-400">
          الحد الأقصى: {maxSizeMb} ميجابايت — اسحب الملف هنا أو اضغط للاختيار
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isUploading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>جاري الرفع...</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p>{error}</p>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] font-bold underline hover:no-underline"
            >
              إخفاء التنبيه
            </button>
          </div>
        </div>
      )}
    </div>
  );
}