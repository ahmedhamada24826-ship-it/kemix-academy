import { AuthenticatedUser } from "@/server/domain/auth/auth.types";

export interface SessionPayload {
  token: string;
  user: AuthenticatedUser;
  expiresAt: Date;
}

/**
 * Session Manager Interface (ISessionManager)
 */
export interface ISessionManager {
  createSession(userId: string, rememberMe?: boolean): Promise<SessionPayload>;
  validateSession(token: string): Promise<AuthenticatedUser | null>;
  revokeSession(token: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}
