import { z } from "zod";

export const LessonTypeEnum = z.enum(["VIDEO", "TEXT", "FILE", "QUIZ"]);
export const VideoSourceEnum = z.enum([
  "UPLOAD",
  "YOUTUBE",
  "GOOGLE_DRIVE",
  "ONEDRIVE",
  "SHAREPOINT",
  "EXTERNAL_URL",
]);
export const UnlockRuleEnum = z.enum([
  "IMMEDIATE",
  "PREVIOUS_LESSON",
  "TASK_SUBMISSION",
  "QUIZ_PASS",
]);

export const CreateLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Lesson title must be at least 2 characters long")
    .max(150, "Lesson title cannot exceed 150 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters long")
    .max(160, "Slug cannot exceed 160 characters")
    .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "Slug must contain only letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000).optional(),
  lessonType: LessonTypeEnum.default("VIDEO"),
  videoSource: VideoSourceEnum.default("UPLOAD"),
  videoProvider: z.string().trim().optional().nullable(),
  videoUrl: z.string().trim().optional().nullable(),
  unlockRule: UnlockRuleEnum.default("IMMEDIATE"),
  content: z.string().optional(),
  storageKey: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().default(false),
  isFreePreview: z.boolean().default(false),
  durationSeconds: z.number().int().nonnegative().default(0),
});

export const UpdateLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Lesson title must be at least 2 characters long")
    .max(150, "Lesson title cannot exceed 150 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters long")
    .max(160, "Slug cannot exceed 160 characters")
    .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "Slug must contain only letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  lessonType: LessonTypeEnum.optional(),
  videoSource: VideoSourceEnum.optional(),
  videoProvider: z.string().trim().optional().nullable(),
  videoUrl: z.string().trim().optional().nullable(),
  unlockRule: UnlockRuleEnum.optional(),
  content: z.string().optional().nullable(),
  storageKey: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
  isFreePreview: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
});

export const ReorderLessonsSchema = z.object({
  lessonOrders: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ).min(1, "Must provide at least one lesson order"),
});

export type CreateLessonSchemaType = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonSchemaType = z.infer<typeof UpdateLessonSchema>;
export type ReorderLessonsSchemaType = z.infer<typeof ReorderLessonsSchema>;

