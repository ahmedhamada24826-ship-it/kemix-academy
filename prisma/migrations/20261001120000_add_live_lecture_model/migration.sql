CREATE TYPE "LiveLectureStatus" AS ENUM ('SCHEDULED', 'READY', 'LIVE', 'PROCESSING', 'RECORDED', 'FAILED');

CREATE TABLE "live_lectures" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "status" "LiveLectureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "youtubeBroadcastId" TEXT,
    "youtubeVideoId" TEXT,
    "youtubeUrl" TEXT,
    "youtubeEmbedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "recordingStatus" TEXT DEFAULT 'NOT_REQUESTED',
    "recordedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_lectures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "live_lectures_courseId_idx"
ON "live_lectures"("courseId");

CREATE INDEX "live_lectures_instructorId_idx"
ON "live_lectures"("instructorId");

CREATE INDEX "live_lectures_status_idx"
ON "live_lectures"("status");

CREATE INDEX "live_lectures_scheduledAt_idx"
ON "live_lectures"("scheduledAt");

ALTER TABLE "live_lectures"
ADD CONSTRAINT "live_lectures_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "live_lectures"
ADD CONSTRAINT "live_lectures_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
