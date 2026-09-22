import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { courseService } from "@/server/application/courses/course.service";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";

const PublishSchema = z.object({
  publish: z.boolean().default(true),
});

interface RouteProps {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: NextRequest, props: RouteProps) {
  try {
    const { courseId } = await props.params;
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required", 401);
    }

    let publish = true;
    try {
      const body = await req.json();
      const parseResult = PublishSchema.safeParse(body);
      if (parseResult.success) {
        publish = parseResult.data.publish;
      }
    } catch {
      // Default to publish = true if body empty
    }

    const course = await courseService.publishCourse(courseId, user, publish);
    return apiSuccess({ course }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish course";
    if (message.includes("Forbidden")) {
      return apiError("FORBIDDEN", message, 403);
    }
    if (message.includes("not found")) {
      return apiError("NOT_FOUND", message, 404);
    }
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
