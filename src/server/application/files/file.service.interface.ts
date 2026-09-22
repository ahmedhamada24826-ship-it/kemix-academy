import {
  FileAssetDto,
  RequestUploadIntentInput,
  RegisterFileAssetInput,
} from "@/server/domain/files/file.types";
import { PresignedUploadTicket } from "@/server/domain/storage/storage.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IFileService {
  requestUploadIntent(
    user: AuthenticatedUser,
    input: RequestUploadIntentInput
  ): Promise<PresignedUploadTicket>;

  registerFileAsset(
    user: AuthenticatedUser,
    input: RegisterFileAssetInput
  ): Promise<FileAssetDto & { publicUrl?: string }>;

  getSignedAccessUrl(
    fileAssetId: string,
    user?: AuthenticatedUser | null
  ): Promise<{ url: string; isDirectPublic: boolean }>;

  deleteFileAsset(
    fileAssetId: string,
    user: AuthenticatedUser
  ): Promise<void>;

  listFileAssets(
    user: AuthenticatedUser,
    filters?: { search?: string; category?: string }
  ): Promise<Array<FileAssetDto & { publicUrl?: string }>>;
}
