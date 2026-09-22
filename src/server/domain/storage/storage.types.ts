/**
 * Storage bucket visibility classification
 */
export type BucketType = "public" | "protected";

/**
 * Upload authorization ticket returned by storage service
 */
export interface PresignedUploadTicket {
  uploadUrl: string;
  storageKey: string;
  bucket: string;
  expiresInSeconds: number;
}

/**
 * Parameters for generating presigned upload authorization
 */
export interface GenerateUploadParams {
  bucketType: BucketType;
  key: string;
  mimeType: string;
  maxSizeBytes?: number;
  expiresInSeconds?: number;
}

/**
 * Parameters for generating signed streaming/download URL
 */
export interface GenerateDownloadParams {
  bucketType: BucketType;
  key: string;
  expiresInSeconds?: number;
  downloadFilename?: string;
}
