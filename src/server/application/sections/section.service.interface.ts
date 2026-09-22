import {
  CourseSectionDto,
  CreateSectionInput,
  UpdateSectionInput,
  ReorderSectionsInput,
} from "@/server/domain/sections/section.types";
import { LessonDto } from "@/server/domain/lessons/lesson.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface ISectionService {
  createSection(
    courseId: string,
    user: AuthenticatedUser,
    input: CreateSectionInput
  ): Promise<CourseSectionDto>;

  updateSection(
    sectionId: string,
    user: AuthenticatedUser,
    input: UpdateSectionInput
  ): Promise<CourseSectionDto>;

  deleteSection(sectionId: string, user: AuthenticatedUser): Promise<void>;

  listSections(
    courseId: string,
    user?: AuthenticatedUser | null
  ): Promise<(CourseSectionDto & { lessons?: LessonDto[] })[]>;

  reorderSections(
    courseId: string,
    user: AuthenticatedUser,
    input: ReorderSectionsInput
  ): Promise<CourseSectionDto[]>;
}
