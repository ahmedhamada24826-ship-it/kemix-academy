const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const [certificateCount, lessonProgressCount, quizAttemptCount, taskSubmissionCount, enrollmentCount] = await Promise.all([
      prisma.certificate.count(),
      prisma.lessonProgress.count(),
      prisma.quizAttempt.count(),
      prisma.taskSubmission.count(),
      prisma.enrollment.count(),
    ]);

    console.log(`before_certificate_count=${certificateCount}`);
    console.log(`before_lesson_progress_count=${lessonProgressCount}`);
    console.log(`before_quiz_attempt_count=${quizAttemptCount}`);
    console.log(`before_task_submission_count=${taskSubmissionCount}`);
    console.log(`before_enrollment_count=${enrollmentCount}`);

    await prisma.$transaction(async (tx) => {
      await tx.certificate.deleteMany({});
      await tx.lessonProgress.deleteMany({});
      await tx.quizAnswer.deleteMany({});
      await tx.quizAttempt.deleteMany({});
      await tx.taskSubmission.deleteMany({});
      await tx.enrollment.updateMany({
        data: {
          status: 'ACTIVE',
          completedAt: null,
        },
      });
    });

    const [afterCertificateCount, afterLessonProgressCount, afterQuizAttemptCount, afterTaskSubmissionCount, afterEnrollmentCount] = await Promise.all([
      prisma.certificate.count(),
      prisma.lessonProgress.count(),
      prisma.quizAttempt.count(),
      prisma.taskSubmission.count(),
      prisma.enrollment.count(),
    ]);

    console.log(`after_certificate_count=${afterCertificateCount}`);
    console.log(`after_lesson_progress_count=${afterLessonProgressCount}`);
    console.log(`after_quiz_attempt_count=${afterQuizAttemptCount}`);
    console.log(`after_task_submission_count=${afterTaskSubmissionCount}`);
    console.log(`after_enrollment_count=${afterEnrollmentCount}`);

    const completedEnrollments = await prisma.enrollment.count({
      where: { status: 'COMPLETED' },
    });
    console.log(`completed_enrollment_count=${completedEnrollments}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
