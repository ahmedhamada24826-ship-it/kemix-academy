-- Extend platform settings for website CMS, branding, and public content.

ALTER TABLE "platform_settings"
ADD COLUMN "siteDescription" TEXT,
ADD COLUMN "supportEmail" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "footerLogoUrl" TEXT,
ADD COLUMN "faviconUrl" TEXT,
ADD COLUMN "footerText" TEXT,
ADD COLUMN "aboutText" TEXT,
ADD COLUMN "contactText" TEXT,
ADD COLUMN "cms" JSONB;
