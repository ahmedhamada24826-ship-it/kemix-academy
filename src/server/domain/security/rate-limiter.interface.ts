export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfterSeconds?: number;
}

/**
 * Interface for rate limiting abstractions (Memory, Redis, etc.)
 */
export interface IRateLimiter {
  /**
   * Consumes 1 point for the given key and checks if rate limit is exceeded.
   */
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;

  /**
   * Resets the rate limit counter for the given key.
   */
  reset(key: string): Promise<void>;
}
