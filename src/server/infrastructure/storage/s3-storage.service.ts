import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "@/server/domain/storage/storage-service.interface";
import {
  BucketType,
  PresignedUploadTicket,
  GenerateUploadParams,
  GenerateDownloadParams,
} from "@/server/domain/storage/storage.types";
import { env } from "@/lib/env";

/**
 * Universal S3-Compatible Storage Provider
 *
 * Communicates strictly via the open AWS S3 protocol.
 * Functions identically with MinIO (local development), Cloudflare R2 ($0 egress production),
 * and AWS S3 with zero code modification.
 */
export class S3CompatibleStorageService implements IStorageService {
  private client: S3Client;
  private publicBucket: string;
  private protectedBucket: string;

  constructor() {
    this.publicBucket = env.S3_PUBLIC_BUCKET;
    this.protectedBucket = env.S3_PRIVATE_BUCKET;

    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  private resolveBucket(bucketType: BucketType): string {
    return bucketType === "public" ? this.publicBucket : this.protectedBucket;
  }

  async getPresignedUploadUrl(params: GenerateUploadParams): Promise<PresignedUploadTicket> {
    const bucket = this.resolveBucket(params.bucketType);
    const expiresIn = params.expiresInSeconds || 900; // 15 minutes default

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ContentType: params.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      uploadUrl,
      storageKey: params.key,
      bucket,
      expiresInSeconds: expiresIn,
    };
  }

  async getPresignedDownloadUrl(params: GenerateDownloadParams): Promise<string> {
    const bucket = this.resolveBucket(params.bucketType);
    const expiresIn = params.expiresInSeconds || 7200; // 2 hours default

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ResponseContentDisposition: params.downloadFilename
        ? `attachment; filename="${params.downloadFilename}"`
        : undefined,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(bucketType: BucketType, key: string): Promise<void> {
    const bucket = this.resolveBucket(bucketType);
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async checkObjectExists(bucketType: BucketType, key: string): Promise<boolean> {
    const bucket = this.resolveBucket(bucketType);
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (env.S3_ENDPOINT) {
      return `${env.S3_ENDPOINT}/${this.publicBucket}/${key}`;
    }
    return `https://${this.publicBucket}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }
}

// Export default singleton instance
export const storageService = new S3CompatibleStorageService();
