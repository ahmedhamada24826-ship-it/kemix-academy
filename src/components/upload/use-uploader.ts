"use client";

import { useCallback, useState } from "react";

// ────────────────────────────────────────────────────────────────────────────
// Reusable direct-to-S3 upload pipeline.
// Uses ONLY the existing backend endpoints:
//   1. POST /api/files/upload-intent  -> presigned PUT ticket
//   2. PUT  <uploadUrl>               -> direct upload to S3-compatible storage
//   3. POST /api/files/register       -> FileAsset row + returned asset id
// ─────────────────────────────────────────────────────────────────────────────

export type UploadCategory =
  | "COURSE_COVER"
  | "VIDEO"
  | "PDF"
  | "DOCUMENT"
  | "IMAGE"
  | "OTHER";

export type UploadVisibility = "PUBLIC" | "PROTECTED";

export interface UploadedAsset {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: UploadCategory;
  visibility: UploadVisibility;
  publicUrl?: string;
}

export interface UploadOptions {
  category: UploadCategory;
  visibility?: UploadVisibility;
  courseId?: string;
  lessonId?: string;
  /** Max accepted size in megabytes (client-side guard). */
  maxSizeMb?: number;
  /** Allowed MIME prefixes or extensions, e.g. ["image/"] or [".csv"]. */
  accept?: string[];
}

export interface UseUploaderState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  asset: UploadedAsset | null;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function validateFile(file: File, options: UploadOptions): string | null {
  const maxSizeMb = options.maxSizeMb ?? 200;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `حجم الملف يتجاوز الحد المسموح (${maxSizeMb} ميجابايت). الحجم الحالي: ${formatBytes(file.size)}`;
  }

  if (options.accept && options.accept.length > 0) {
    const matched = options.accept.some((rule) => {
      if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
      if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule.toLowerCase());
      return file.type === rule;
    });
    if (!matched) {
      return `نوع الملف غير مدعوم (${file.type || "غير معروف"}).`;
    }
  }
  return null;
}

/**
 * PUTs the file directly to object storage with real progress via XHR
 * (fetch() cannot report upload progress).
 */
function putToStorage(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`فشل رفع الملف إلى المخزن (رمز ${xhr.status})`));
      }
    };

    xhr.onerror = () =>
      reject(new Error("تعذر الاتصال بمخزن الملفات. تأكد من تشغيل خدمة التخزين (MinIO)."));
    xhr.ontimeout = () => reject(new Error("انتهت مهلة رفع الملف."));
    xhr.send(file);
  });
}
export function useUploader() {
  const [state, setState] = useState<UseUploaderState>({
    isUploading: false,
    progress: 0,
    error: null,
    asset: null,
  });

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, asset: null });
  }, []);

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadedAsset | null> => {
      const validationError = validateFile(file, options);
      if (validationError) {
        setState({ isUploading: false, progress: 0, error: validationError, asset: null });
        return null;
      }

      setState({ isUploading: true, progress: 0, error: null, asset: null });

      try {
        // 1. Request presigned upload ticket
        const intentRes = await fetch("/api/files/upload-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            category: options.category,
            visibility: options.visibility ?? "PROTECTED",
            courseId: options.courseId,
            lessonId: options.lessonId,
          }),
        });

        const intentJson = await intentRes.json().catch(() => null);
        if (!intentRes.ok || !intentJson?.success) {
          throw new Error(intentJson?.error?.message || "تعذر الحصول على تصريح الرفع");
        }

        const ticket = intentJson.data.ticket as {
          uploadUrl: string;
          storageKey: string;
        };

        // 2. Direct upload to the S3-compatible bucket
        await putToStorage(ticket.uploadUrl, file, file.type || "application/octet-stream", (p) =>
          setState((prev) => ({ ...prev, progress: p }))
        );

        // 3. Register the FileAsset row
        const registerRes = await fetch("/api/files/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageKey: ticket.storageKey,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            category: options.category,
            visibility: options.visibility ?? "PROTECTED",
            courseId: options.courseId,
            lessonId: options.lessonId,
          }),
        });

        const registerJson = await registerRes.json().catch(() => null);
        if (!registerRes.ok || !registerJson?.success) {
          throw new Error(
            registerJson?.error?.message || "تم الرفع لكن فشل تسجيل الملف في قاعدة البيانات"
          );
        }

        let asset = registerJson.data.fileAsset as UploadedAsset;
        if (!asset.publicUrl && asset.id) {
          const accessRes = await fetch(`/api/files/${asset.id}/access`, { cache: "no-store" });
          const accessJson = await accessRes.json().catch(() => null);
          if (accessRes.ok && accessJson?.success && accessJson.data?.url) {
            asset = { ...asset, publicUrl: accessJson.data.url };
          }
        }

        setState({ isUploading: false, progress: 100, error: null, asset });
        return asset;
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل رفع الملف";
        setState({ isUploading: false, progress: 0, error: message, asset: null });
        return null;
      }
    },
    []
  );

  return { ...state, upload, reset };
}