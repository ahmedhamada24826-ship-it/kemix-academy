import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { enrollmentService } from "@/server/application/enrollments/enrollment.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    const enrollment = await enrollmentService.getEnrollment(user.id, courseId);
    return apiSuccess({ isEnrolled: !!enrollment && enrollment.status === "ACTIVE", enrollment }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get enrollment status";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    await enrollmentService.cancelEnrollment(user.id, courseId, user);
    return apiSuccess({ message: "Enrollment cancelled successfully" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel enrollment";
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
