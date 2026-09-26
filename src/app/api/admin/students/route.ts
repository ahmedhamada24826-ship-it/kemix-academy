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
      where.course = {
        OR: [
          { instructorId: user.id },
          { coInstructors: { some: { instructorId: user.id } } },
        ],
      };
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
            role: true,
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
    const groupedStudents = new Map<
      string,
      {
        user: (typeof enrollments)[number]["user"];
        enrollments: Array<{
          courseId: string;
          courseTitle: string;
          status: string;
          progressPercent: number;
          enrolledAt: Date;
        }>;
      }
    >();

    for (const enr of enrollments) {
      const userId = enr.userId;
      const entry = groupedStudents.get(userId) ?? {
        user: enr.user,
        enrollments: [],
      };

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

      entry.enrollments.push({
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        status: enr.status,
        progressPercent,
        enrolledAt: enr.enrolledAt,
      });

      groupedStudents.set(userId, entry);
    }

    const studentData = Array.from(groupedStudents.values()).map(({ user, enrollments: userEnrollments }) => {
      const fullName = user.fullName?.trim() || "Student";
      const email = user.email?.trim() || "";
      const averageProgress =
        userEnrollments.length > 0
          ? Math.round(
              userEnrollments.reduce((sum, item) => sum + item.progressPercent, 0) / userEnrollments.length
            )
          : 0;

      const firstEnrollment = userEnrollments[0];

      return {
        id: user.id,
        userId: user.id,
        fullName,
        email,
        phone: null,
        role: user.role || "STUDENT",
        createdAt: user.createdAt,
        enrollmentsCount: userEnrollments.length,
        completedCoursesCount: userEnrollments.filter((item) => item.status === "COMPLETED").length,
        averageProgress,
        enrollments: userEnrollments.map((item) => ({
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          status: item.status,
          progressPercentage: item.progressPercent,
          enrolledAt: item.enrolledAt,
        })),
        studentName: fullName,
        studentEmail: email,
        courseId: firstEnrollment?.courseId ?? null,
        courseTitle: firstEnrollment?.courseTitle ?? "",
        enrollmentStatus: firstEnrollment?.status ?? null,
        enrollmentType: "SELF",
        enrolledAt: firstEnrollment?.enrolledAt ?? user.createdAt,
        progressPercent: averageProgress,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        quizzesPassed: 0,
        totalQuizAttempts: 0,
        taskSubmissionsCount: 0,
        hasCertificate: false,
        certificateCode: null,
      };
    });

    return apiSuccess({ students: studentData, total: studentData.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch students";
    return apiError("STUDENTS_FETCH_ERROR", message, 400);
  }
}
