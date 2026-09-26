CREATE TABLE "course_instructors" (
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("courseId", "instructorId")
);

CREATE INDEX "course_instructors_instructorId_idx" ON "course_instructors"("instructorId");

ALTER TABLE "course_instructors"
ADD CONSTRAINT "course_instructors_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_instructors"
ADD CONSTRAINT "course_instructors_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;