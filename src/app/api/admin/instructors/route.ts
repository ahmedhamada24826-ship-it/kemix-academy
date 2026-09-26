import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/application/auth/auth-guard";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/server/infrastructure/http/api-response";
import { passwordHasher } from "@/server/infrastructure/security/argon2-hasher";
import { emailSchema } from "@/server/domain/auth/email-normalizer";
import { validatePassword } from "@/server/domain/auth/password-policy";

const CreateInstructorSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(128),
  bio: z.string().trim().max(2000).optional(),
});

const UpdateInstructorByIdSchema = z.object({
  instructorId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
}).refine((value) => value.fullName !== undefined || value.bio !== undefined, {
  message: "At least one instructor field must be provided",
});

const PromoteInstructorSchema = z.object({
  email: emailSchema,
  bio: z.string().trim().max(2000).nullable().optional(),
}).strict();

const UpdateInstructorSchema = z.union([
  UpdateInstructorByIdSchema,
  PromoteInstructorSchema,
]);

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { error: apiError("UNAUTHENTICATED", "Authentication required", 401) };
  if (user.role !== "ADMIN") {
    return { error: apiError("FORBIDDEN", "Admin access required", 403) };
  }
  return { user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const instructors = await prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: { id: true, fullName: true, email: true, avatarUrl: true, bio: true },
      orderBy: { fullName: "asc" },
    });

    return apiSuccess({ instructors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list instructors";
    return apiError("INSTRUCTOR_LIST_ERROR", message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const parseResult = CreateInstructorSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid instructor account data",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    const passwordValidation = validatePassword(parseResult.data.password);
    if (!passwordValidation.valid) {
      return apiError("PASSWORD_POLICY_VIOLATION", passwordValidation.error ?? "Invalid password", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: parseResult.data.email },
      select: { id: true },
    });
    if (existing) return apiError("EMAIL_ALREADY_REGISTERED", "هذا البريد مسجل بالفعل.", 409);

    const passwordHash = await passwordHasher.hash(parseResult.data.password);
    const instructor = await prisma.user.create({
      data: {
        fullName: parseResult.data.fullName,
        email: parseResult.data.email,
        passwordHash,
        bio: parseResult.data.bio,
        role: "INSTRUCTOR",
        status: "ACTIVE",
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true, bio: true },
    });

    return apiSuccess({ instructor }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create instructor";
    return apiError("INSTRUCTOR_CREATE_ERROR", message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const parseResult = UpdateInstructorSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid instructor update data",
        400,
        parseResult.error.flatten().fieldErrors
      );
    }

    if ("email" in parseResult.data) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: parseResult.data.email },
        select: { id: true, role: true },
      });
      if (!existingByEmail) {
        return apiError("USER_NOT_FOUND", "لا يوجد حساب مسجل بهذا البريد الإلكتروني.", 404);
      }
      if (existingByEmail.role === "INSTRUCTOR") {
        return apiError("ALREADY_INSTRUCTOR", "هذا الحساب مسجل كمدرب بالفعل.", 409);
      }
      if (existingByEmail.role !== "STUDENT") {
        return apiError("INVALID_ROLE", "يمكن ترقية حساب الطالب فقط إلى مدرب.", 409);
      }

      const instructor = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          role: "INSTRUCTOR",
          ...(parseResult.data.bio !== undefined && { bio: parseResult.data.bio }),
        },
        select: { id: true, fullName: true, email: true, avatarUrl: true, bio: true },
      });

      return apiSuccess({ instructor });
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: parseResult.data.instructorId,
        OR: [
          { role: "INSTRUCTOR" },
          { role: "ADMIN", instructedCourses: { some: {} } },
        ],
      },
      select: { id: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Instructor not found", 404);

    const instructor = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(parseResult.data.fullName !== undefined && { fullName: parseResult.data.fullName }),
        ...(parseResult.data.bio !== undefined && { bio: parseResult.data.bio }),
      },
      select: { id: true, fullName: true, email: true, avatarUrl: true, bio: true },
    });

    return apiSuccess({ instructor });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update instructor";
    return apiError("INSTRUCTOR_UPDATE_ERROR", message, 500);
  }
}