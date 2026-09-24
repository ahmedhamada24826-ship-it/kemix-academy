import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { enrollmentService } from "@/server/application/enrollments/enrollment.service";
import {
  SelfEnrollSchema,
  AdminAssignEnrollmentSchema,
  EnrollmentQuerySchema,
} from "@/server/domain/enrollments/enrollment-schemas";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parseResult = EnrollmentQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return apiError(
        "INVALID_QUERY",
        "Invalid enrollment query parameters",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    if (user.role === "ADMIN" || (user.role === "INSTRUCTOR" && parseResult.data.courseId)) {
      const result = await enrollmentService.listAllEnrollments(user, parseResult.data);
      const normalizedEnrollments = (result.enrollments ?? []).map((enrollment: any) => {
        const student = enrollment.user ?? enrollment.student ?? null;
        const course = enrollment.course ?? null;

        return {
          ...enrollment,
          student: student
            ? {
                id: student.id,
                fullName: student.fullName ?? "Student",
                email: student.email ?? "",
              }
            : null,
          user: student,
          course: course,
          studentId: enrollment.userId ?? enrollment.studentId ?? student?.id ?? null,
        };
      });

      return apiSuccess({ ...result, enrollments: normalizedEnrollments }, 200);
    }

    // Default to user's own enrollments
    const result = await enrollmentService.listUserEnrollments(user.id, parseResult.data);
    const normalizedOwnEnrollments = (result.enrollments ?? []).map((enrollment: any) => {
      const course = enrollment.course ?? null;
      const student = enrollment.user ?? enrollment.student ?? null;

      return {
        ...enrollment,
        student: student
          ? {
              id: student.id,
              fullName: student.fullName ?? "Student",
              email: student.email ?? "",
            }
          : null,
        user: student,
        course,
        studentId: enrollment.userId ?? enrollment.studentId ?? student?.id ?? null,
      };
    });

    return apiSuccess({ ...result, enrollments: normalizedOwnEnrollments }, 200);
  } catch (err) {
    console.error("❌ /api/enrollments GET failure:", err instanceof Error ? err.message : err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve enrollments", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const body = await req.json();

    // Check if admin assignment request (contains userId)
    if (body.userId && user.role === "ADMIN") {
      const parseResult = AdminAssignEnrollmentSchema.safeParse(body);
      if (!parseResult.success) {
        return apiError(
          "VALIDATION_ERROR",
          "Invalid admin enrollment assignment",
          400,
          parseResult.error.flatten().fieldErrors
        );
      }
      const enrollment = await enrollmentService.adminAssign(user, parseResult.data);
      return apiSuccess({ enrollment }, 201);
    }

    // Otherwise self-enroll
    const parseResult = SelfEnrollSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid enrollment input",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const enrollment = await enrollmentService.selfEnroll(user.id, parseResult.data.courseId);
    return apiSuccess({ enrollment }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enroll";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("unpublished") || message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
