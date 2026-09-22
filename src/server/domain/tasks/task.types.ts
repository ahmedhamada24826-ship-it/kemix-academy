import { TaskSubmissionStatus } from "@/types";

export interface TaskDto {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  deadline: Date | null;
  maxFileSizeMb: number;
  allowedFileTypes: string;
  maxAttempts: number;
  isPublished: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  submissionsCount?: number;
  userSubmission?: TaskSubmissionDto | null;
  course?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
}

export interface TaskSubmissionDto {
  id: string;
  taskId: string;
  userId: string;
  attemptNumber: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  textResponse: string | null;
  status: TaskSubmissionStatus;
  score: number | null;
  feedback: string | null;
  reviewerId: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  reviewer?: {
    id: string;
    fullName: string;
  } | null;
}

export interface CreateTaskInput {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  deadline?: Date | null;
  maxFileSizeMb?: number;
  allowedFileTypes?: string;
  maxAttempts?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  deadline?: Date | null;
  maxFileSizeMb?: number;
  allowedFileTypes?: string;
  maxAttempts?: number;
  isPublished?: boolean;
  isArchived?: boolean;
  sortOrder?: number;
}

export interface SubmitTaskInput {
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  textResponse?: string | null;
}

export interface GradeTaskSubmissionInput {
  score: number;
  feedback?: string | null;
  status?: TaskSubmissionStatus;
}
