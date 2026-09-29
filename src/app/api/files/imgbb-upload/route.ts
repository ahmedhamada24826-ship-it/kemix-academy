import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";
import { env } from "@/lib/env";

/**
 * POST /api/files/imgbb-upload
 *
 * Server-side proxy that forwards an image to ImgBB.
 * Keeps the API key hidden from the client.
 *
 * Accepts: multipart/form-data with field "image" (File).
 * Returns: { url, deleteUrl, width, height }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth guard — any authenticated user can upload images
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const apiKey = env.IMGBB_API_KEY;
    if (!apiKey) {
      return apiError(
        "CONFIG_ERROR",
        "ImgBB API key is not configured. Add IMGBB_API_KEY to your environment variables.",
        500
      );
    }

    // Parse multipart form data from the client request
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return apiError("VALIDATION_ERROR", "No image file provided in 'image' field", 400);
    }

    // Max 32 MB (ImgBB limit for free tier)
    const MAX_SIZE = 32 * 1024 * 1024;
    if (imageFile.size > MAX_SIZE) {
      return apiError(
        "FILE_TOO_LARGE",
        `Image exceeds the 32 MB limit. Current size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
        413
      );
    }

    // Supported image MIME types by ImgBB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff", "image/svg+xml"];
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return apiError(
        "UNSUPPORTED_FILE_TYPE",
        `Unsupported file type: ${imageFile.type}. Supported: JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG`,
        415
      );
    }

    // Convert to base64 (ImgBB API requires base64 encoded image)
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Forward to ImgBB API
    const imgbbForm = new URLSearchParams();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", base64);
    imgbbForm.append("name", imageFile.name.replace(/\.[^/.]+$/, "")); // name without extension

    const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    });

    if (!imgbbRes.ok) {
      const errText = await imgbbRes.text().catch(() => "Unknown error");
      console.error("[ImgBB] Upload failed:", imgbbRes.status, errText);
      return apiError(
        "IMGBB_ERROR",
        `ImgBB upload failed (HTTP ${imgbbRes.status}). Please try again.`,
        502
      );
    }

    const imgbbJson = await imgbbRes.json().catch(() => null);

    if (!imgbbJson?.success || !imgbbJson?.data?.url) {
      console.error("[ImgBB] Unexpected response:", JSON.stringify(imgbbJson));
      return apiError("IMGBB_ERROR", "ImgBB returned an unexpected response", 502);
    }

    const uploadedUrl = imgbbJson.data.url as string;
    const originalName = imageFile.name || "image.png";

    // Optional: register in Database FileAsset so it appears in the Media Library
    let registeredAsset = null;
    try {
      const { prisma } = await import("@/lib/prisma");
      registeredAsset = await prisma.fileAsset.create({
        data: {
          storageKey: uploadedUrl,
          originalName,
          mimeType: imageFile.type || "image/png",
          size: imageFile.size || 0,
          category: "IMAGE",
          visibility: "PUBLIC",
          uploadedById: user.id,
        },
      });
    } catch (dbErr) {
      console.warn("[ImgBB] Could not register FileAsset in database:", dbErr);
    }

    return apiSuccess(
      {
        url: uploadedUrl,
        displayUrl: imgbbJson.data.display_url as string,
        deleteUrl: imgbbJson.data.delete_url as string,
        width: imgbbJson.data.width as number,
        height: imgbbJson.data.height as number,
        size: imgbbJson.data.size as number,
        fileAsset: registeredAsset,
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    console.error("[ImgBB Route] Unexpected error:", err);
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
