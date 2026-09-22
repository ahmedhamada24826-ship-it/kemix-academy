import { z } from "zod";

export const UpdateLessonProgressSchema = z.object({
  completed: z.boolean().optional(),
  progressPercent: z
    .number()
    .int()
    .min(0, "Progress percent cannot be less than 0")
    .max(100, "Progress percent cannot exceed 100")
    .optional(),
  lastPositionSeconds: z
    .number()
    .int()
    .nonnegative("Position seconds must be non-negative")
    .optional(),
});

export type UpdateLessonProgressSchemaType = z.infer<typeof UpdateLessonProgressSchema>;
