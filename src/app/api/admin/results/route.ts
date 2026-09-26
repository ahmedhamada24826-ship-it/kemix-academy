import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { quizService } from "@/server/application/quizzes/quiz.service";
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
    const quizId = searchParams.get("quizId") || undefined;

    const attempts = await quizService.listAllAttempts(user, { courseId, quizId });

    // Aggregate statistics
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const failedAttempts = totalAttempts - passedAttempts;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

    // Task submissions stats
    const taskSubmissionsCount = await prisma.taskSubmission.count({
      where: courseId
        ? { task: { courseId } }
        : user.role === "INSTRUCTOR"
        ? {
            task: {
              course: {
                OR: [
                  { instructorId: user.id },
                  { coInstructors: { some: { instructorId: user.id } } },
                ],
              },
            },
          }
        : {},
    });

    const reviewedTasksCount = await prisma.taskSubmission.count({
      where: {
        status: "REVIEWED",
        ...(courseId
          ? { task: { courseId } }
          : user.role === "INSTRUCTOR"
          ? {
              task: {
                course: {
                  OR: [
                    { instructorId: user.id },
                    { coInstructors: { some: { instructorId: user.id } } },
                  ],
                },
              },
            }
          : {}),
      },
    });

    const results = attempts.map((attempt) => ({
      ...attempt,
      student: attempt.user,
    }));

    return apiSuccess({
      stats: {
        totalAttempts,
        passedAttempts,
        failedAttempts,
        passRate,
        averageScore,
        taskSubmissionsCount,
        reviewedTasksCount,
      },
      attempts,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch results";
    return apiError("RESULTS_FETCH_ERROR", message, 400);
  }
}
