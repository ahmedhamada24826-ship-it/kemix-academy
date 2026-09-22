import {
  PlatformSettingsDto,
  UpdatePlatformSettingsInput,
  WhatsAppMessagePayload,
} from "@/server/domain/settings/settings.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IPlatformSettingsService {
  getSettings(): Promise<PlatformSettingsDto>;
  updateSettings(user: AuthenticatedUser, input: UpdatePlatformSettingsInput): Promise<PlatformSettingsDto>;
  buildWhatsAppUrl(payload: WhatsAppMessagePayload): Promise<{ whatsappUrl: string; message: string }>;
}
