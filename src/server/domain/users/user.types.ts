import { Role, UserStatus } from "@/types";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}
