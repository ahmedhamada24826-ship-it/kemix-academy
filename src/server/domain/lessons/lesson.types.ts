import { LessonType, VideoSource, UnlockRule } from "@/types";

/** Attached resource file (mirrors the FileAsset model projection). */
export interface LessonFileDto {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  visibility: string;
  createdAt: Date;
}

/** Quiz option as delivered to learners (isCorrect stripped for non-managers). */
export interface LessonQuizOptionDto {
  id: string;
  questionId: string;
  text: string;
  sortOrder: number;
  isCorrect?: boolean;
}

export interface LessonQuizQuestionDto {
  id: string;
  quizId: string;
  prompt: string;
  questionType: string;
  points: number;
  sortOrder: number;
  explanation?: string | null;
  options: LessonQuizOptionDto[];
}

/** Published quiz attached to a lesson, ready for the learner quiz runner. */
export interface LessonQuizDto {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showResultImmediately: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  questions: LessonQuizQuestionDto[];
}

export interface LessonDto {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  description: string | null;
  lessonType: LessonType;
  videoSource: VideoSource;
  videoProvider: string | null;
  videoUrl: string | null;
  unlockRule: UnlockRule;
  content: string | null;
  storageKey: string | null;
  sortOrder: number;
  isPublished: boolean;
  isFreePreview: boolean;
  isArchived: boolean;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  /** Attached lesson resources (present on single-lesson reads). */
  files?: LessonFileDto[];
  /** Published lesson quizzes with questions/options (present on single-lesson reads). */
  quizzes?: LessonQuizDto[];
}

export interface CreateLessonInput {
  title: string;
  slug?: string;
  description?: string;
  lessonType?: LessonType;
  videoSource?: VideoSource;
  videoProvider?: string | null;
  videoUrl?: string | null;
  unlockRule?: UnlockRule;
  content?: string;
  storageKey?: string;
  sortOrder?: number;
  isPublished?: boolean;
  isFreePreview?: boolean;
  durationSeconds?: number;
}

export interface UpdateLessonInput {
  title?: string;
  slug?: string;
  description?: string | null;
  lessonType?: LessonType;
  videoSource?: VideoSource;
  videoProvider?: string | null;
  videoUrl?: string | null;
  unlockRule?: UnlockRule;
  content?: string | null;
  storageKey?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
  isFreePreview?: boolean;
  isArchived?: boolean;
  durationSeconds?: number;
}

export interface ReorderLessonsInput {
  lessonOrders: {
    id: string;
    sortOrder: number;
  }[];
}

