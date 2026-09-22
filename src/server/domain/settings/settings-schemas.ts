import { z } from "zod";

const CmsStatItemSchema = z.object({
  value: z.string().max(80),
  label: z.string().max(120),
});

const CmsFeatureItemSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(600),
});

const CmsTestimonialItemSchema = z.object({
  quote: z.string().max(800),
  author: z.string().max(120),
  role: z.string().max(120),
  badge: z.string().max(120),
});

export const HomepageCmsSchema = z.object({
  hero: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    badge: z.string().max(200),
    heading: z.string().max(300),
    subheading: z.string().max(200),
    description: z.string().max(1000),
    ctaPrimary: z.string().max(80),
    ctaSecondary: z.string().max(80),
    imageUrl: z.string().max(2000),
    videoUrl: z.string().max(2000),
    videoTitle: z.string().max(200),
  }),
  stats: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    items: z.array(CmsStatItemSchema).max(8),
  }),
  featuredCourses: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    description: z.string().max(600),
  }),
  about: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    description: z.string().max(2000),
    imageUrl: z.string().max(2000),
  }),
  features: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    description: z.string().max(600),
    items: z.array(CmsFeatureItemSchema).max(8),
  }),
  instructors: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    description: z.string().max(600),
  }),
  testimonials: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    items: z.array(CmsTestimonialItemSchema).max(12),
  }),
  cta: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
    heading: z.string().max(200),
    description: z.string().max(600),
    buttonText: z.string().max(80),
  }),
  footer: z.object({
    enabled: z.boolean(),
    sortOrder: z.number().int(),
  }),
});

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .optional()
  .or(z.literal(""));

export const UpdatePlatformSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(100).optional(),
  siteDescription: z.string().trim().max(2000).nullable().optional(),
  supportEmail: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
  logoUrl: optionalUrl,
  footerLogoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  footerText: z.string().trim().max(2000).nullable().optional(),
  aboutText: z.string().trim().max(8000).nullable().optional(),
  contactText: z.string().trim().max(4000).nullable().optional(),
  cms: HomepageCmsSchema.optional(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Please enter a valid international phone number with country code")
    .optional(),
  whatsappTemplate: z.string().trim().min(10).max(1000).optional(),
  defaultCurrency: z.string().trim().min(2).max(10).optional(),
  allowRegistration: z.boolean().optional(),
});

export type UpdatePlatformSettingsSchemaType = z.infer<typeof UpdatePlatformSettingsSchema>;
