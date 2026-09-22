import {
  QuizDto,
  QuizQuestionDto,
  QuizAttemptDto,
  CreateQuizInput,
  UpdateQuizInput,
  CreateQuizQuestionInput,
  SubmitQuizAttemptInput,
  ManualOverrideInput,
} from "@/server/domain/quizzes/quiz.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IQuizService {
  createQuiz(
    user: AuthenticatedUser,
    input: CreateQuizInput
  ): Promise<QuizDto>;

  updateQuiz(
    quizId: string,
    user: AuthenticatedUser,
    input: UpdateQuizInput
  ): Promise<QuizDto>;

  deleteQuiz(quizId: string, user: AuthenticatedUser): Promise<void>;

  addQuestion(
    quizId: string,
    user: AuthenticatedUser,
    input: CreateQuizQuestionInput
  ): Promise<QuizQuestionDto>;

  getQuizById(
    quizId: string,
    user?: AuthenticatedUser | null
  ): Promise<QuizDto>;

  listQuizzesByCourse(
    courseId: string,
    user: AuthenticatedUser
  ): Promise<QuizDto[]>;

  startAttempt(
    quizId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto>;

  submitAttempt(
    attemptId: string,
    user: AuthenticatedUser,
    input: SubmitQuizAttemptInput
  ): Promise<QuizAttemptDto>;

  getAttempt(
    attemptId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto>;

  listUserAttempts(
    quizId: string,
    userId: string,
    user: AuthenticatedUser
  ): Promise<QuizAttemptDto[]>;

  listAllAttempts(
    user: AuthenticatedUser,
    params?: { courseId?: string; quizId?: string; passed?: boolean }
  ): Promise<QuizAttemptDto[]>;

  manualOverride(
    adminUser: AuthenticatedUser,
    input: ManualOverrideInput
  ): Promise<{ success: boolean; message: string }>;
}

