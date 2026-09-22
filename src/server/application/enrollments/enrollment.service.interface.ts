import {
  EnrollmentDto,
  AdminAssignEnrollmentInput,
  EnrollmentFilterParams,
} from "@/server/domain/enrollments/enrollment.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface IEnrollmentService {
  selfEnroll(userId: string, courseId: string): Promise<EnrollmentDto>;

  adminAssign(
    assignedBy: AuthenticatedUser,
    input: AdminAssignEnrollmentInput
  ): Promise<EnrollmentDto>;

  getEnrollment(
    userId: string,
    courseId: string
  ): Promise<EnrollmentDto | null>;

  listUserEnrollments(
    userId: string,
    params?: EnrollmentFilterParams
  ): Promise<{ enrollments: EnrollmentDto[]; total: number }>;

  listAllEnrollments(
    user: AuthenticatedUser,
    params?: EnrollmentFilterParams
  ): Promise<{ enrollments: EnrollmentDto[]; total: number }>;

  cancelEnrollment(
    userId: string,
    courseId: string,
    performedBy: AuthenticatedUser
  ): Promise<void>;
}
