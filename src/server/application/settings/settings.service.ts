import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  PlatformSettingsDto,
  UpdatePlatformSettingsInput,
  WhatsAppMessagePayload,
} from "@/server/domain/settings/settings.types";
import { DEFAULT_HOMEPAGE_CMS, mergeHomepageCms } from "@/server/domain/settings/homepage-cms";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";
import { IPlatformSettingsService } from "./settings.service.interface";
import { auditLogService } from "../audit/audit.service";

const DEFAULT_SETTINGS: PlatformSettingsDto = {
  id: "global",
  siteName: "KEMIX Academy",
  siteDescription: "الأكاديمية العربية الرائدة في علوم البيانات والذكاء الاصطناعي",
  supportEmail: "support@kemix.academy",
  logoUrl: null,
  footerLogoUrl: null,
  faviconUrl: null,
  footerText:
    "منصة تعليمية متخصصة في إعداد محللي ومهندسي البيانات من خلال مشاريع وتطبيقات عملية واقعية واختبارات معتمدة.",
  aboutText: null,
  contactText: null,
  cms: structuredClone(DEFAULT_HOMEPAGE_CMS),
  whatsappNumber: "+201000000000",
  whatsappTemplate:
    "مرحبًا KEMIX Academy،\nأرغب في الاشتراك في كورس {course_name}.\n\nاسم الكورس: {course_name}\nالسعر: {price} {currency}\nاسم الطالب: {student_name}\nالبريد الإلكتروني: {student_email}",
  defaultCurrency: "EGP",
  allowRegistration: true,
  updatedAt: new Date(),
};

function emptyToNull(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function toDto(row: {
  id: string;
  siteName: string;
  siteDescription?: string | null;
  supportEmail?: string | null;
  logoUrl?: string | null;
  footerLogoUrl?: string | null;
  faviconUrl?: string | null;
  footerText?: string | null;
  aboutText?: string | null;
  contactText?: string | null;
  cms?: Prisma.JsonValue | null;
  whatsappNumber: string;
  whatsappTemplate: string;
  defaultCurrency: string;
  allowRegistration: boolean;
  updatedAt: Date;
}): PlatformSettingsDto {
  return {
    id: row.id,
    siteName: row.siteName,
    siteDescription: row.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
    supportEmail: row.supportEmail ?? DEFAULT_SETTINGS.supportEmail,
    logoUrl: row.logoUrl ?? null,
    footerLogoUrl: row.footerLogoUrl ?? null,
    faviconUrl: row.faviconUrl ?? null,
    footerText: row.footerText ?? DEFAULT_SETTINGS.footerText,
    aboutText: row.aboutText ?? null,
    contactText: row.contactText ?? null,
    cms: mergeHomepageCms(row.cms),
    whatsappNumber: row.whatsappNumber,
    whatsappTemplate: row.whatsappTemplate,
    defaultCurrency: row.defaultCurrency,
    allowRegistration: row.allowRegistration,
    updatedAt: row.updatedAt,
  };
}

export class PlatformSettingsService implements IPlatformSettingsService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async getSettings(): Promise<PlatformSettingsDto> {
    try {
      let settings = await this.prisma.platformSettings.findUnique({
        where: { id: "global" },
      });

      if (!settings) {
        settings = await this.prisma.platformSettings.create({
          data: {
            id: "global",
            siteName: DEFAULT_SETTINGS.siteName,
            siteDescription: DEFAULT_SETTINGS.siteDescription,
            supportEmail: DEFAULT_SETTINGS.supportEmail,
            footerText: DEFAULT_SETTINGS.footerText,
            cms: DEFAULT_HOMEPAGE_CMS as unknown as Prisma.InputJsonValue,
            whatsappNumber: DEFAULT_SETTINGS.whatsappNumber,
            whatsappTemplate: DEFAULT_SETTINGS.whatsappTemplate,
            defaultCurrency: DEFAULT_SETTINGS.defaultCurrency,
            allowRegistration: DEFAULT_SETTINGS.allowRegistration,
          },
        });
      }

      return toDto(settings);
    } catch {
      return { ...DEFAULT_SETTINGS, cms: structuredClone(DEFAULT_HOMEPAGE_CMS) };
    }
  }

  async updateSettings(
    user: AuthenticatedUser,
    input: UpdatePlatformSettingsInput
  ): Promise<PlatformSettingsDto> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only administrators can modify platform settings");
    }

    const current = await this.getSettings();
    const nextCms = input.cms ? mergeHomepageCms(input.cms) : current.cms;

    const updated = await this.prisma.platformSettings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        siteName: input.siteName ?? current.siteName,
        siteDescription: emptyToNull(input.siteDescription) ?? current.siteDescription,
        supportEmail: emptyToNull(input.supportEmail) ?? current.supportEmail,
        logoUrl: emptyToNull(input.logoUrl) ?? current.logoUrl,
        footerLogoUrl: emptyToNull(input.footerLogoUrl) ?? current.footerLogoUrl,
        faviconUrl: emptyToNull(input.faviconUrl) ?? current.faviconUrl,
        footerText: emptyToNull(input.footerText) ?? current.footerText,
        aboutText: emptyToNull(input.aboutText) ?? current.aboutText,
        contactText: emptyToNull(input.contactText) ?? current.contactText,
        cms: nextCms as unknown as Prisma.InputJsonValue,
        whatsappNumber: input.whatsappNumber ?? current.whatsappNumber,
        whatsappTemplate: input.whatsappTemplate ?? current.whatsappTemplate,
        defaultCurrency: input.defaultCurrency ?? current.defaultCurrency,
        allowRegistration: input.allowRegistration ?? current.allowRegistration,
      },
      update: {
        ...(input.siteName !== undefined && { siteName: input.siteName }),
        ...(input.siteDescription !== undefined && {
          siteDescription: emptyToNull(input.siteDescription),
        }),
        ...(input.supportEmail !== undefined && { supportEmail: emptyToNull(input.supportEmail) }),
        ...(input.logoUrl !== undefined && { logoUrl: emptyToNull(input.logoUrl) }),
        ...(input.footerLogoUrl !== undefined && { footerLogoUrl: emptyToNull(input.footerLogoUrl) }),
        ...(input.faviconUrl !== undefined && { faviconUrl: emptyToNull(input.faviconUrl) }),
        ...(input.footerText !== undefined && { footerText: emptyToNull(input.footerText) }),
        ...(input.aboutText !== undefined && { aboutText: emptyToNull(input.aboutText) }),
        ...(input.contactText !== undefined && { contactText: emptyToNull(input.contactText) }),
        ...(input.cms !== undefined && { cms: nextCms as unknown as Prisma.InputJsonValue }),
        ...(input.whatsappNumber !== undefined && { whatsappNumber: input.whatsappNumber }),
        ...(input.whatsappTemplate !== undefined && { whatsappTemplate: input.whatsappTemplate }),
        ...(input.defaultCurrency !== undefined && { defaultCurrency: input.defaultCurrency }),
        ...(input.allowRegistration !== undefined && { allowRegistration: input.allowRegistration }),
      },
    });

    await auditLogService.recordLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "SETTINGS_UPDATED",
      entity: "PlatformSettings",
      entityId: "global",
      details: { ...input, cms: input.cms ? { updated: true } : undefined },
    });

    return toDto(updated);
  }

  async buildWhatsAppUrl(
    payload: WhatsAppMessagePayload
  ): Promise<{ whatsappUrl: string; message: string }> {
    const settings = await this.getSettings();

    let message = settings.whatsappTemplate
      .replace(/{course_name}/g, payload.courseName)
      .replace(/{price}/g, payload.price.toLocaleString("en-US"))
      .replace(/{currency}/g, payload.currency)
      .replace(/{student_name}/g, payload.studentName)
      .replace(/{student_email}/g, payload.studentEmail)
      .replace(/{student_phone}/g, payload.studentPhone ?? "");

    const sanitizedPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

    return {
      whatsappUrl,
      message,
    };
  }
}

export const platformSettingsService = new PlatformSettingsService();
