import { z } from "zod";

export const FileCategoryEnum = z.enum([
  "COURSE_COVER",
  "VIDEO",
  "PDF",
  "DOCUMENT",
  "IMAGE",
  "OTHER",
]);

export const FileVisibilityEnum = z.enum(["PUBLIC", "PROTECTED"]);

export const RequestUploadIntentSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required").max(255),
  mimeType: z.string().trim().min(1, "MIME type is required").max(100),
  size: z.number().int().positive("Size must be greater than 0").max(500 * 1024 * 1024, "File exceeds 500MB maximum limit"),
  category: FileCategoryEnum.default("OTHER"),
  visibility: FileVisibilityEnum.default("PROTECTED"),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
});

export const RegisterFileAssetSchema = z.object({
  storageKey: z.string().trim().min(1, "Storage key is required"),
  originalName: z.string().trim().min(1, "Original name is required").max(255),
  mimeType: z.string().trim().min(1, "MIME type is required").max(100),
  size: z.number().int().positive("Size must be greater than 0"),
  category: FileCategoryEnum.default("OTHER"),
  visibility: FileVisibilityEnum.default("PROTECTED"),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
});

export type RequestUploadIntentSchemaType = z.infer<typeof RequestUploadIntentSchema>;
export type RegisterFileAssetSchemaType = z.infer<typeof RegisterFileAssetSchema>;
