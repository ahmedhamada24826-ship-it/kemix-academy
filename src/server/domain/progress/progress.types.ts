export interface LessonProgressDto {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  completed: boolean;
  progressPercent: number;
  lastPositionSeconds: number;
  isManuallyUnlocked: boolean;
  unlockedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseProgressDto {
  courseId: string;
  userId: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  isCompleted: boolean;
  lessonProgressList: LessonProgressDto[];
}

export interface UpdateLessonProgressInput {
  completed?: boolean;
  progressPercent?: number;
  lastPositionSeconds?: number;
  isManuallyUnlocked?: boolean;
}

export interface LessonUnlockStatusDto {
  lessonId: string;
  isUnlocked: boolean;
  lockReason?: string;
}

