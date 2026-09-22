import { HomepageCms } from "./homepage-cms";

export interface PlatformSettingsDto {
  id: string;
  siteName: string;
  siteDescription: string | null;
  supportEmail: string | null;
  logoUrl: string | null;
  footerLogoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  aboutText: string | null;
  contactText: string | null;
  cms: HomepageCms;
  whatsappNumber: string;
  whatsappTemplate: string;
  defaultCurrency: string;
  allowRegistration: boolean;
  updatedAt: Date;
}

export interface UpdatePlatformSettingsInput {
  siteName?: string;
  siteDescription?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  footerLogoUrl?: string | null;
  faviconUrl?: string | null;
  footerText?: string | null;
  aboutText?: string | null;
  contactText?: string | null;
  cms?: HomepageCms;
  whatsappNumber?: string;
  whatsappTemplate?: string;
  defaultCurrency?: string;
  allowRegistration?: boolean;
}

export interface WhatsAppMessagePayload {
  courseName: string;
  price: number;
  currency: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
}
