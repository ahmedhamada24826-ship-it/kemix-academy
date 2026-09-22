import { CourseLevel, CourseStatus } from "@/types";

export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  coverImageUrl: string | null;
  status: CourseStatus;
  level: CourseLevel;
  price: number;
  currency: string;
  isFree: boolean;
  certificatesEnabled: boolean;
  tools: string[];
  requirements: string | null;
  whatYouWillLearn: string[];
  sortOrder: number;
  isArchived: boolean;
  instructorId: string;
  durationSeconds: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  instructor?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface CreateCourseInput {
  title: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  coverImageUrl?: string | null;
  level?: CourseLevel;
  price?: number;
  currency?: string;
  isFree?: boolean;
  certificatesEnabled?: boolean;
  tools?: string[];
  requirements?: string | null;
  whatYouWillLearn?: string[];
  sortOrder?: number;
  durationSeconds?: number;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string;
  coverImageUrl?: string | null;
  level?: CourseLevel;
  price?: number;
  currency?: string;
  isFree?: boolean;
  certificatesEnabled?: boolean;
  tools?: string[];
  requirements?: string | null;
  whatYouWillLearn?: string[];
  sortOrder?: number;
  isArchived?: boolean;
  durationSeconds?: number;
  status?: CourseStatus;
}

export interface CourseFilterParams {
  status?: CourseStatus;
  level?: CourseLevel;
  instructorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

