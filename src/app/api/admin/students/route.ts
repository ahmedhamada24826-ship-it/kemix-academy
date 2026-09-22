import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (user.role === "STUDENT") {
      return apiError("FORBIDDEN", "Forbidden: Insufficient permissions", 403);
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {};
    if (courseId) {
      where.courseId = courseId;
    }

    if (user.role === "INSTRUCTOR") {
      where.course = { instructorId: user.id };
    }

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            _count: {
              select: {
                sections: true,
              },
            },
          },
        },
      },
    });

    // Enhance with progress, quiz results, and certificates
    const studentData = await Promise.all(
      enrollments.map(async (enr) => {
        const [completedLessonsCount, totalPublishedLessons, quizAttempts, taskSubmissions, cert] =
          await Promise.all([
            prisma.lessonProgress.count({
              where: {
                userId: enr.userId,
                courseId: enr.courseId,
                completed: true,
              },
            }),
            prisma.lesson.count({
              where: {
                section: { courseId: enr.courseId },
                isPublished: true,
              },
            }),
            prisma.quizAttempt.findMany({
              where: {
                userId: enr.userId,
                quiz: { courseId: enr.courseId },
              },
              select: {
                score: true,
                passed: true,
                status: true,
              },
            }),
            prisma.taskSubmission.count({
              where: {
                userId: enr.userId,
                task: { courseId: enr.courseId },
              },
            }),
            prisma.certificate.findUnique({
              where: {
                userId_courseId: {
                  userId: enr.userId,
                  courseId: enr.courseId,
                },
              },
              select: {
                certificateCode: true,
                issuedAt: true,
              },
            }),
          ]);

        const progressPercent =
          totalPublishedLessons > 0
            ? Math.round((completedLessonsCount / totalPublishedLessons) * 100)
            : 0;

        const passedQuizzesCount = quizAttempts.filter((q) => q.passed).length;
        const totalQuizzesCount = quizAttempts.length;

        return {
          id: enr.id,
          userId: enr.userId,
          studentName: enr.user.fullName,
          studentEmail: enr.user.email,
          courseId: enr.courseId,
          courseTitle: enr.course.title,
          enrollmentStatus: enr.status,
          enrollmentType: enr.enrollmentType,
          enrolledAt: enr.enrolledAt,
          progressPercent,
          completedLessonsCount,
          totalLessonsCount: totalPublishedLessons,
          quizzesPassed: passedQuizzesCount,
          totalQuizAttempts: totalQuizzesCount,
          taskSubmissionsCount: taskSubmissions,
          hasCertificate: !!cert,
          certificateCode: cert?.certificateCode || null,
        };
      })
    );

    return apiSuccess({ students: studentData, total: studentData.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch students";
    return apiError("STUDENTS_FETCH_ERROR", message, 400);
  }
}
