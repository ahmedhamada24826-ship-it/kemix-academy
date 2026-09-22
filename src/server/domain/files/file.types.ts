import { FileCategory, FileVisibility } from "@/types";

export interface FileAssetDto {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  visibility: FileVisibility;
  uploadedById: string;
  courseId: string | null;
  lessonId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestUploadIntentInput {
  filename: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  visibility?: FileVisibility;
  courseId?: string;
  lessonId?: string;
}

export interface RegisterFileAssetInput {
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  visibility?: FileVisibility;
  courseId?: string;
  lessonId?: string;
}
