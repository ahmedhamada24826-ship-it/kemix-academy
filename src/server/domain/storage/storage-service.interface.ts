import {
  BucketType,
  PresignedUploadTicket,
  GenerateUploadParams,
  GenerateDownloadParams,
} from "./storage.types";

/**
 * Storage Service Abstraction (IStorageService)
 *
 * Decouples the application domain from specific object storage providers
 * (Cloudflare R2, AWS S3, MinIO, or local disk).
 * The domain depends strictly on this interface.
 */
export interface IStorageService {
  /**
   * Generates a short-lived presigned URL for direct client-to-storage upload.
   */
  getPresignedUploadUrl(params: GenerateUploadParams): Promise<PresignedUploadTicket>;

  /**
   * Generates a time-limited signed URL for authorized streaming or download.
   */
  getPresignedDownloadUrl(params: GenerateDownloadParams): Promise<string>;

  /**
   * Permanently deletes a stored object by bucket and key.
   */
  deleteObject(bucketType: BucketType, key: string): Promise<void>;

  /**
   * Verifies the existence of an object in storage.
   */
  checkObjectExists(bucketType: BucketType, key: string): Promise<boolean>;

  /**
   * Resolves the public CDN/S3 URL for publicly accessible assets.
   */
  getPublicUrl(key: string): string;
}
