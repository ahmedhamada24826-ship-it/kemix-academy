/**
 * Core User Roles supported by KEMIX Academy
 */
export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

/**
 * Account lifecycle and moderation statuses
 */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

/**
 * Supported course difficulty levels
 */
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

/**
 * Course publication statuses
 */
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Lesson content types
 */
export type LessonType = "VIDEO" | "TEXT" | "FILE" | "QUIZ";

/**
 * Video source types
 */
export type VideoSource =
  | "UPLOAD"
  | "YOUTUBE"
  | "GOOGLE_DRIVE"
  | "ONEDRIVE"
  | "SHAREPOINT"
  | "EXTERNAL_URL";

/**
 * Progression unlock rules
 */
export type UnlockRule =
  | "IMMEDIATE"
  | "PREVIOUS_LESSON"
  | "TASK_SUBMISSION"
  | "QUIZ_PASS";

/**
 * Enrollment lifecycle statuses
 */
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

/**
 * Supported enrollment models
 */
export type EnrollmentType = "FREE_ENROLLMENT" | "ADMIN_ASSIGNED" | "PURCHASED";

/**
 * Storage file categories
 */
export type FileCategory =
  | "COURSE_COVER"
  | "VIDEO"
  | "PDF"
  | "DOCUMENT"
  | "IMAGE"
  | "OTHER";

/**
 * Storage visibility classification
 */
export type FileVisibility = "PUBLIC" | "PROTECTED";

/**
 * Quiz question types
 */
export type QuestionType = "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE";

/**
 * Quiz attempt evaluation statuses
 */
export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "ABANDONED";

/**
 * Task submission review statuses
 */
export type TaskSubmissionStatus = "SUBMITTED" | "LATE" | "REVIEWED" | "REJECTED";

/**
 * WhatsApp payment / enrollment request statuses
 */
export type PaymentRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Generic API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

