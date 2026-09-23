import { z } from "zod";

export const QuestionTypeEnum = z.enum([
  "MULTIPLE_CHOICE",
  "SINGLE_CHOICE",
  "TRUE_FALSE",
]);

const QuizScheduleFields = {
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
};

export const CreateQuizSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
  lessonId: z.string().uuid("Invalid lesson ID format").optional().nullable(),
  title: z
    .string()
    .trim()
    .min(3, "Quiz title must be at least 3 characters long")
    .max(150, "Quiz title cannot exceed 150 characters"),
  description: z.string().trim().max(1000).optional().nullable(),
  passingScore: z
    .number()
    .int()
    .min(1, "Passing score must be between 1 and 100")
    .max(100, "Passing score must be between 1 and 100")
    .default(70),
  timeLimitMinutes: z.number().int().positive().optional().nullable(),
  maxAttempts: z.number().int().nonnegative().default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeAnswers: z.boolean().default(false),
  showResultImmediately: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  ...QuizScheduleFields,
  isPublished: z.boolean().default(false),
}).refine((value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt, {
  message: "Quiz closing time must be after opening time",
  path: ["endsAt"],
});

export const UpdateQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Quiz title must be at least 3 characters long")
    .max(150, "Quiz title cannot exceed 150 characters")
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  lessonId: z.string().uuid("Invalid lesson ID format").optional().nullable(),
  passingScore: z
    .number()
    .int()
    .min(1, "Passing score must be between 1 and 100")
    .max(100, "Passing score must be between 1 and 100")
    .optional(),
  timeLimitMinutes: z.number().int().positive().optional().nullable(),
  maxAttempts: z.number().int().nonnegative().optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeAnswers: z.boolean().optional(),
  showResultImmediately: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  ...QuizScheduleFields,
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
}).refine((value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt, {
  message: "Quiz closing time must be after opening time",
  path: ["endsAt"],
});

export const CreateQuizQuestionSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Question prompt must be at least 3 characters long"),
  questionType: QuestionTypeEnum.default("SINGLE_CHOICE"),
  sortOrder: z.number().int().nonnegative().default(0),
  points: z.number().int().positive().default(1),
  explanation: z.string().trim().max(1000).optional().nullable(),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Option text cannot be empty"),
        isCorrect: z.boolean().default(false),
        sortOrder: z.number().int().nonnegative().optional(),
      })
    )
    .min(2, "Questions must have at least 2 options")
    .refine((opts) => opts.some((o) => o.isCorrect), {
      message: "At least one option must be marked as correct",
    }),
});

export const UpdateQuizQuestionSchema = z.object({
  prompt: z.string().trim().min(3).optional(),
  questionType: QuestionTypeEnum.optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  points: z.number().int().positive().optional(),
  explanation: z.string().trim().max(1000).optional().nullable(),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        isCorrect: z.boolean(),
        sortOrder: z.number().int().nonnegative().optional(),
      })
    )
    .min(2)
    .refine((opts) => opts.some((option) => option.isCorrect), {
      message: "At least one option must be marked as correct",
    })
    .optional(),
});

export const SubmitQuizAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionId: z.string().uuid(),
    })
  ),
});

export const ManualOverrideSchema = z.object({
  studentEmail: z.string().email("Invalid student email address"),
  courseId: z.string().uuid("Invalid course ID"),
  action: z.enum([
    "UNLOCK_LESSON",
    "PASS_QUIZ",
    "COMPLETE_LESSON",
    "RESET_ATTEMPTS",
    "REVOKE_ACCESS",
  ]),
  lessonId: z.string().uuid("Invalid lesson ID").optional(),
  quizId: z.string().uuid("Invalid quiz ID").optional(),
  reason: z.string().trim().min(5, "A reason of at least 5 characters is required"),
});

export type CreateQuizSchemaType = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizSchemaType = z.infer<typeof UpdateQuizSchema>;
export type CreateQuizQuestionSchemaType = z.infer<typeof CreateQuizQuestionSchema>;
export type UpdateQuizQuestionSchemaType = z.infer<typeof UpdateQuizQuestionSchema>;
export type SubmitQuizAttemptSchemaType = z.infer<typeof SubmitQuizAttemptSchema>;
export type ManualOverrideSchemaType = z.infer<typeof ManualOverrideSchema>;

