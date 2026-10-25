import { LiveLectureStatus } from "@/types";

export interface LiveLectureDto {
  id: string;
  title: string;
  courseId: string;
  instructorId: string;
  scheduledAt: string;
  durationMinutes: number;
  description?: string | null;
  status: LiveLectureStatus;
  youtubeBroadcastId?: string | null;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  youtubeEmbedUrl?: string | null;
  thumbnailUrl?: string | null;
  recordingStatus?: string | null;
  recordedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    slug?: string;
    status?: string;
  };
  instructor?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateLiveLectureInput {
  title: string;
  courseId: string;
  instructorId: string;
  scheduledAt: string | Date;
  durationMinutes?: number;
  description?: string | null;
  status?: LiveLectureStatus;
}

export interface UpdateLiveLectureInput {
  title?: string;
  courseId?: string;
  instructorId?: string;
  scheduledAt?: string | Date;
  durationMinutes?: number;
  description?: string | null;
  status?: LiveLectureStatus;
  youtubeBroadcastId?: string | null;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  youtubeEmbedUrl?: string | null;
  thumbnailUrl?: string | null;
  recordingStatus?: string | null;
  recordedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}
