import { z } from "zod";

export const CreateTaskSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  lessonId: z.string().uuid("Invalid lesson ID"),
  title: z
    .string()
    .trim()
    .min(3, "Task title must be at least 3 characters long")
    .max(150, "Task title cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Task description must be at least 5 characters long"),
  deadline: z.coerce.date().optional().nullable(),
  maxFileSizeMb: z.coerce.number().int().min(1).max(500).default(50),
  allowedFileTypes: z
    .string()
    .trim()
    .default("pdf,zip,doc,docx,xlsx,xls,csv,png,jpg,jpeg"),
  maxAttempts: z.coerce.number().int().min(1).max(20).default(1),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Task title must be at least 3 characters long")
    .max(150, "Task title cannot exceed 150 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(5, "Task description must be at least 5 characters long")
    .optional(),
  deadline: z.coerce.date().optional().nullable(),
  maxFileSizeMb: z.coerce.number().int().min(1).max(500).optional(),
  allowedFileTypes: z.string().trim().optional(),
  maxAttempts: z.coerce.number().int().min(1).max(20).optional(),
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const SubmitTaskSchema = z.object({
  fileUrl: z.string().trim().optional().nullable(),
  fileName: z.string().trim().optional().nullable(),
  fileSize: z.coerce.number().int().nonnegative().optional().nullable(),
  textResponse: z.string().trim().optional().nullable(),
}).refine((data) => data.fileUrl || data.textResponse, {
  message: "Submission must contain either a file or a text response",
});

export const GradeTaskSubmissionSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  feedback: z.string().trim().optional().nullable(),
  status: z.enum(["SUBMITTED", "LATE", "REVIEWED", "REJECTED"]).default("REVIEWED"),
});

export type CreateTaskSchemaType = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskSchemaType = z.infer<typeof UpdateTaskSchema>;
export type SubmitTaskSchemaType = z.infer<typeof SubmitTaskSchema>;
export type GradeTaskSubmissionSchemaType = z.infer<typeof GradeTaskSubmissionSchema>;
