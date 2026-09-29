"use client";

import { useCallback, useState } from "react";

// ────────────────────────────────────────────────────────────────────────────
// ImgBB Image Upload Hook
// Uploads images through the server-side proxy at /api/files/imgbb-upload
// which keeps the API key hidden from the client.
// ─────────────────────────────────────────────────────────────────────────────

export interface ImgBBUploadResult {
  url: string;
  displayUrl: string;
  deleteUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface UseImgBBUploaderState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: ImgBBUploadResult | null;
}

const MAX_SIZE_MB = 32;

/** Validates image file before upload */
function validateImageFile(file: File): string | null {
  const maxBytes = MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
    return `حجم الصورة (${sizeMb} MB) يتجاوز الحد المسموح (${MAX_SIZE_MB} MB).`;
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return `نوع الملف غير مدعوم (${file.type || "غير معروف"}). الأنواع المدعومة: JPEG، PNG، GIF، WEBP، BMP، SVG.`;
  }

  return null;
}

export function useImgBBUploader() {
  const [state, setState] = useState<UseImgBBUploaderState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, result: null });
  }, []);

  const upload = useCallback(async (file: File): Promise<ImgBBUploadResult> => {
    // Client-side validation
    const validationError = validateImageFile(file);
    if (validationError) {
      setState({ isUploading: false, progress: 0, error: validationError, result: null });
      throw new Error(validationError);
    }

    setState({ isUploading: true, progress: 10, error: null, result: null });

    try {
      // Build multipart form for the proxy endpoint
      const formData = new FormData();
      formData.append("image", file);

      setState((prev) => ({ ...prev, progress: 30 }));

      const res = await fetch("/api/files/imgbb-upload", {
        method: "POST",
        body: formData,
      });

      setState((prev) => ({ ...prev, progress: 80 }));

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const message =
          json?.error?.message ||
          (res.status === 500 ? "مفتاح ImgBB غير مضبوط. راجع ملف .env" : "فشل رفع الصورة إلى ImgBB");
        throw new Error(message);
      }

      const result: ImgBBUploadResult = json.data;
      setState({ isUploading: false, progress: 100, error: null, result });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل رفع الصورة";
      setState({ isUploading: false, progress: 0, error: message, result: null });
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  return { ...state, upload, reset };
}
