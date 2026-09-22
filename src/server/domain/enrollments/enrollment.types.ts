import { EnrollmentStatus, EnrollmentType } from "@/types";

export interface EnrollmentDto {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrollmentType: EnrollmentType;
  enrolledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface SelfEnrollInput {
  courseId: string;
}

export interface AdminAssignEnrollmentInput {
  userId: string;
  courseId: string;
  enrollmentType?: EnrollmentType;
}

export interface EnrollmentFilterParams {
  userId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
}
