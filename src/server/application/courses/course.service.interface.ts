import {
  CourseDto,
  CreateCourseInput,
  UpdateCourseInput,
  CourseFilterParams,
} from "@/server/domain/courses/course.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface ICourseService {
  createCourse(
    instructorId: string,
    input: CreateCourseInput
  ): Promise<CourseDto>;

  updateCourse(
    courseId: string,
    user: AuthenticatedUser,
    input: UpdateCourseInput
  ): Promise<CourseDto>;

  getCourseById(
    courseId: string,
    user?: AuthenticatedUser | null
  ): Promise<CourseDto & { isEnrolled?: boolean; canManage?: boolean }>;

  getCourseBySlug(
    slug: string,
    user?: AuthenticatedUser | null
  ): Promise<CourseDto & { isEnrolled?: boolean; canManage?: boolean }>;

  listCourses(
    params: CourseFilterParams,
    user?: AuthenticatedUser | null
  ): Promise<{ courses: CourseDto[]; total: number; page: number; limit: number }>;

  publishCourse(
    courseId: string,
    user: AuthenticatedUser,
    publish: boolean
  ): Promise<CourseDto>;

  deleteCourse(courseId: string, user: AuthenticatedUser): Promise<void>;
}
