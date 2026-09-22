import { QuestionType, QuizAttemptStatus } from "@/types";

export interface QuizOptionDto {
  id: string;
  questionId: string;
  text: string;
  isCorrect?: boolean; // Stripped for students before submission
  sortOrder: number;
}

export interface QuizQuestionDto {
  id: string;
  quizId: string;
  prompt: string;
  questionType: QuestionType;
  sortOrder: number;
  points: number;
  explanation?: string | null; // Stripped for students during active attempt
  options: QuizOptionDto[];
}

export interface QuizDto {
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
  isPublished: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuizQuestionDto[];
}

export interface QuizAnswerDto {
  id: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface QuizAttemptDto {
  id: string;
  quizId: string;
  userId: string;
  status: QuizAttemptStatus;
  score: number | null;
  passed: boolean;
  attemptNumber: number;
  timeSpentSeconds?: number | null;
  startedAt: Date;
  expiresAt?: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  answers?: QuizAnswerDto[];
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMinutes: number | null;
  };
}

export interface CreateQuizInput {
  courseId: string;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  showResultImmediately?: boolean;
  showCorrectAnswers?: boolean;
  allowReview?: boolean;
  isPublished?: boolean;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string | null;
  lessonId?: string | null;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  showResultImmediately?: boolean;
  showCorrectAnswers?: boolean;
  allowReview?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;
}

export interface CreateQuizQuestionInput {
  prompt: string;
  questionType?: QuestionType;
  sortOrder?: number;
  points?: number;
  explanation?: string | null;
  options: {
    text: string;
    isCorrect: boolean;
    sortOrder?: number;
  }[];
}

export interface SubmitQuizAttemptInput {
  answers: {
    questionId: string;
    selectedOptionId: string;
  }[];
}

export interface ManualOverrideInput {
  studentEmail: string;
  courseId: string;
  action: "UNLOCK_LESSON" | "PASS_QUIZ" | "COMPLETE_LESSON" | "RESET_ATTEMPTS" | "REVOKE_ACCESS";
  lessonId?: string;
  quizId?: string;
  reason: string;
}

