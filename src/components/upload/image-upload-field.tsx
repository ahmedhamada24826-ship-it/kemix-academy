"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";
import { FileDropzone } from "./file-dropzone";
import type { UploadCategory, UploadVisibility } from "./use-uploader";

export interface ImageUploadFieldProps {
  label: string;
  /** Current image URL (public URL or external link). */
  value: string;
  onChange: (url: string) => void;
  category?: UploadCategory;
  visibility?: UploadVisibility;
  courseId?: string;
  maxSizeMb?: number;
  hint?: string;
  previewClassName?: string;
  className?: string;
}

/**
 * Reusable image uploader + manual URL entry with live preview.
 * Powers course covers, header/footer logos and the favicon.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  category = "IMAGE",
  visibility = "PUBLIC",
  courseId,
  maxSizeMb = 10,
  hint,
  previewClassName,
  className,
}: ImageUploadFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-20 w-32 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden",
            previewClassName
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-400" />
          )}
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... أو ارفع صورة جديدة"
            className="font-mono text-xs dir-ltr text-left h-9"
          />
          {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] font-bold text-red-600 hover:underline"
            >
              إزالة الصورة
            </button>
          )}
        </div>
      </div>

      <FileDropzone
        category={category}
        visibility={visibility}
        courseId={courseId}
        maxSizeMb={maxSizeMb}
        accept={["image/*"]}
        label="رفع صورة من الجهاز"
        hint="الصيغ المدعومة: PNG, JPG, WEBP, SVG"
        onUploaded={(asset) => {
          const url = asset.publicUrl || `/api/files/${asset.id}/access?redirect=1`;
          onChange(url);
        }}
      />
    </div>
  );
}