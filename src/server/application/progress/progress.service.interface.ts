import {
  LessonProgressDto,
  CourseProgressDto,
  UpdateLessonProgressInput,
  LessonUnlockStatusDto,
} from "@/server/domain/progress/progress.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IProgressService {
  updateLessonProgress(
    userId: string,
    lessonId: string,
    input: UpdateLessonProgressInput
  ): Promise<LessonProgressDto>;

  getCourseProgress(
    userId: string,
    courseId: string,
    requestingUser: AuthenticatedUser
  ): Promise<CourseProgressDto>;

  calculateCourseCompletion(
    userId: string,
    courseId: string
  ): Promise<{
    totalLessons: number;
    completedLessons: number;
    percentage: number;
    isCompleted: boolean;
  }>;

  checkLessonUnlockStatus(
    userId: string,
    lessonId: string
  ): Promise<LessonUnlockStatusDto>;
}

