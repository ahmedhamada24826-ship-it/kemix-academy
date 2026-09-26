import { z } from "zod";

export const CourseLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
]);

export const CourseStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const CreateCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(150, "Title cannot exceed 150 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(160, "Slug cannot exceed 160 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(300, "Short description cannot exceed 300 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long"),
  coverImageUrl: z.string().url("Invalid cover image URL").optional().nullable(),
  level: CourseLevelEnum.default("ALL_LEVELS"),
  price: z.coerce.number().min(0, "Price must be non-negative").default(0),
  currency: z.string().trim().min(2).max(10).default("EGP"),
  isFree: z.boolean().default(true),
  certificatesEnabled: z.boolean().default(false),
  tools: z.array(z.string().trim()).default([]),
  requirements: z.string().trim().optional().nullable(),
  whatYouWillLearn: z.array(z.string().trim()).default([]),
  sortOrder: z.coerce.number().int().default(0),
  durationSeconds: z.coerce.number().int().nonnegative().default(0),
});

export const UpdateCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(150, "Title cannot exceed 150 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters long")
    .max(160, "Slug cannot exceed 160 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(300, "Short description cannot exceed 300 characters")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long")
    .optional(),
  coverImageUrl: z.string().url("Invalid cover image URL").optional().nullable(),
  level: CourseLevelEnum.optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(2).max(10).optional(),
  isFree: z.boolean().optional(),
  certificatesEnabled: z.boolean().optional(),
  tools: z.array(z.string().trim()).optional(),
  requirements: z.string().trim().optional().nullable(),
  whatYouWillLearn: z.array(z.string().trim()).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isArchived: z.boolean().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().optional(),
  status: CourseStatusEnum.optional(),
  coInstructorIds: z.array(z.string().uuid()).max(20).optional(),
});

export const CourseQuerySchema = z.object({
  status: CourseStatusEnum.optional(),
  level: CourseLevelEnum.optional(),
  instructorId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateCourseSchemaType = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseSchemaType = z.infer<typeof UpdateCourseSchema>;
export type CourseQuerySchemaType = z.infer<typeof CourseQuerySchema>;

