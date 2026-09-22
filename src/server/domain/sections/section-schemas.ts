import { z } from "zod";

export const CreateSectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Section title must be at least 2 characters long")
    .max(120, "Section title cannot exceed 120 characters"),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const UpdateSectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Section title must be at least 2 characters long")
    .max(120, "Section title cannot exceed 120 characters")
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const ReorderSectionsSchema = z.object({
  sectionOrders: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().nonnegative(),
    })
  ).min(1, "Must provide at least one section order"),
});

export type CreateSectionSchemaType = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionSchemaType = z.infer<typeof UpdateSectionSchema>;
export type ReorderSectionsSchemaType = z.infer<typeof ReorderSectionsSchema>;
