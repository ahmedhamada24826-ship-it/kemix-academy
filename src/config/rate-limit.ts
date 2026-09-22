/**
 * Centralized Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 15 * 60, // 15 minutes
  },
  REGISTER: {
    MAX_ATTEMPTS: 3,
    WINDOW_SECONDS: 60 * 60, // 1 hour
  },
  FORGOT_PASSWORD: {
    MAX_ATTEMPTS: 3,
    WINDOW_SECONDS: 60 * 60, // 1 hour
  },
} as const;

