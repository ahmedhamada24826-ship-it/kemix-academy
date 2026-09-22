import {
  TaskDto,
  TaskSubmissionDto,
  CreateTaskInput,
  UpdateTaskInput,
  SubmitTaskInput,
  GradeTaskSubmissionInput,
} from "@/server/domain/tasks/task.types";
import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface ITaskService {
  createTask(user: AuthenticatedUser, input: CreateTaskInput): Promise<TaskDto>;
  updateTask(taskId: string, user: AuthenticatedUser, input: UpdateTaskInput): Promise<TaskDto>;
  deleteTask(taskId: string, user: AuthenticatedUser): Promise<void>;
  getTaskById(taskId: string, user?: AuthenticatedUser | null): Promise<TaskDto>;
  listTasksByLesson(lessonId: string, user?: AuthenticatedUser | null): Promise<TaskDto[]>;
  listTasksByCourse(courseId: string, user: AuthenticatedUser): Promise<TaskDto[]>;
  listAllTasks(user: AuthenticatedUser): Promise<TaskDto[]>;
  submitTask(taskId: string, user: AuthenticatedUser, input: SubmitTaskInput): Promise<TaskSubmissionDto>;
  listSubmissions(taskId: string, user: AuthenticatedUser): Promise<TaskSubmissionDto[]>;
  getUserSubmission(taskId: string, userId: string, user: AuthenticatedUser): Promise<TaskSubmissionDto | null>;
  gradeSubmission(submissionId: string, user: AuthenticatedUser, input: GradeTaskSubmissionInput): Promise<TaskSubmissionDto>;
}
