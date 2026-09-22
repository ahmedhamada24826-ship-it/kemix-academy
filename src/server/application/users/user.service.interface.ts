import { UserProfile, UpdateProfileInput } from "@/server/domain/users/user.types";

/**
 * Application Service Contract for User Profile Operations
 */
export interface IUserService {
  getProfileById(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile>;
}
