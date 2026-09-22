import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlatformSettingsService } from "./settings.service";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

describe("PlatformSettingsService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  let settingsService: PlatformSettingsService;

  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    email: "admin@kemix.com",
    fullName: "Admin User",
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      platformSettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    settingsService = new PlatformSettingsService(mockPrisma as unknown as PrismaClient);
  });

  describe("getSettings", () => {
    it("returns default settings if none created yet", async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue(null);
      mockPrisma.platformSettings.create.mockResolvedValue({
        id: "global",
        siteName: "KEMIX Academy",
        whatsappNumber: "+201000000000",
        whatsappTemplate: "Default template",
        defaultCurrency: "EGP",
        allowRegistration: true,
      });

      const settings = await settingsService.getSettings();
      expect(settings.siteName).toBe("KEMIX Academy");
      expect(settings.whatsappNumber).toBeDefined();
    });
  });

  describe("updateSettings", () => {
    it("allows admin to update platform settings and whatsapp template", async () => {
      mockPrisma.platformSettings.findUnique.mockResolvedValue({
        id: "global",
        siteName: "KEMIX Academy",
        whatsappNumber: "+201000000000",
        whatsappTemplate: "Default template",
        defaultCurrency: "EGP",
        allowRegistration: true,
      });

      mockPrisma.platformSettings.upsert.mockResolvedValue({
        id: "global",
        siteName: "KEMIX Academy",
        whatsappNumber: "+201011223344",
        whatsappTemplate: "Hello KEMIX: {course_name}",
        defaultCurrency: "EGP",
        allowRegistration: true,
      });

      const updated = await settingsService.updateSettings(adminUser, {
        whatsappNumber: "+201011223344",
        whatsappTemplate: "Hello KEMIX: {course_name}",
      });

      expect(updated.whatsappNumber).toBe("+201011223344");
    });
  });
});
