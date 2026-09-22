import {
  LessonDto,
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from "@/server/domain/lessons/lesson.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface ILessonService {
  createLesson(
    sectionId: string,
    user: AuthenticatedUser,
    input: CreateLessonInput
  ): Promise<LessonDto>;

  updateLesson(
    lessonId: string,
    user: AuthenticatedUser,
    input: UpdateLessonInput
  ): Promise<LessonDto>;

  deleteLesson(lessonId: string, user: AuthenticatedUser): Promise<void>;

  getLessonById(
    lessonId: string,
    user?: AuthenticatedUser | null
  ): Promise<LessonDto>;

  listLessonsBySection(
    sectionId: string,
    user?: AuthenticatedUser | null
  ): Promise<LessonDto[]>;

  reorderLessons(
    sectionId: string,
    user: AuthenticatedUser,
    input: ReorderLessonsInput
  ): Promise<LessonDto[]>;
}
