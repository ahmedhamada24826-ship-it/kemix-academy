import { VideoSource } from "@/types";

export interface VideoSourceInfo {
  source: VideoSource;
  embedUrl: string | null;
  warning?: string;
  isEmbeddable: boolean;
}

/**
 * Validates and formats various video URLs for secure and seamless embedded playback.
 */
export function parseVideoSource(
  source: VideoSource,
  videoUrl?: string | null,
  storageKey?: string | null
): VideoSourceInfo {
  if (source === "UPLOAD") {
    return {
      source,
      embedUrl: null, // Will use storage presigned URL or direct player
      isEmbeddable: true,
    };
  }

  if (!videoUrl || videoUrl.trim() === "") {
    return {
      source,
      embedUrl: null,
      isEmbeddable: false,
      warning: "لم يتم تحديد رابط الفيديو",
    };
  }

  const url = videoUrl.trim();

  // 1. YouTube
  if (source === "YOUTUBE") {
    let videoId: string | null = null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        if (parsed.pathname === "/watch") {
          videoId = parsed.searchParams.get("v");
        } else if (parsed.pathname.startsWith("/embed/")) {
          videoId = parsed.pathname.split("/embed/")[1];
        } else if (parsed.pathname.startsWith("/v/")) {
          videoId = parsed.pathname.split("/v/")[1];
        }
      } else if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.substring(1);
      }
    } catch {
      return {
        source,
        embedUrl: null,
        isEmbeddable: false,
        warning: "رابط YouTube غير صالح",
      };
    }

    if (videoId) {
      // Clean possible parameters attached to videoId
      const cleanId = videoId.split("&")[0].split("?")[0];
      return {
        source,
        embedUrl: `https://www.youtube.com/embed/${cleanId}?rel=0&modestbranding=1`,
        isEmbeddable: true,
      };
    }

    return {
      source,
      embedUrl: null,
      isEmbeddable: false,
      warning: "تعذر استخراج معرّف الفيديو من رابط YouTube",
    };
  }

  // 2. Google Drive
  if (source === "GOOGLE_DRIVE") {
    let fileId: string | null = null;
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        fileId = match[1];
      } else {
        const parsed = new URL(url);
        fileId = parsed.searchParams.get("id");
      }
    } catch {
      return {
        source,
        embedUrl: null,
        isEmbeddable: false,
        warning: "رابط Google Drive غير صالح",
      };
    }

    if (fileId) {
      return {
        source,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isEmbeddable: true,
        warning:
          "تنبيه: يجب ضبط صلاحية الملف على Google Drive ليكون متاحًا لمن لديه الرابط (Anyone with the link can view).",
      };
    }

    return {
      source,
      embedUrl: null,
      isEmbeddable: false,
      warning: "تعذر استخراج معرّف ملف Google Drive",
    };
  }

  // 3. OneDrive
  if (source === "ONEDRIVE") {
    if (url.includes("onedrive.live.com/embed") || url.includes("1drv.ms")) {
      return {
        source,
        embedUrl: url,
        isEmbeddable: true,
        warning: "تأكد من استخدام خيار 'تضمين' (Embed) من OneDrive لضمان التشغيل.",
      };
    }
    return {
      source,
      embedUrl: url,
      isEmbeddable: true,
      warning: "تأكد من أن الرابط مباشر أو رابط تضمين يدعم العرض داخل المتصفح.",
    };
  }

  // 4. SharePoint
  if (source === "SHAREPOINT") {
    return {
      source,
      embedUrl: url,
      isEmbeddable: true,
      warning:
        "تنبيه SharePoint: يجب أن يمتلك الطلاب صلاحية الوصول للمؤسسة أو الرابط لفتح الفيديو.",
    };
  }

  // 5. External URL
  return {
    source,
    embedUrl: url,
    isEmbeddable: true,
  };
}
