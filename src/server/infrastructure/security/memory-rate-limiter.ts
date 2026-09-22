import {
  IRateLimiter,
  RateLimitResult,
} from "@/server/domain/security/rate-limiter.interface";

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * In-Memory Sliding Window Rate Limiter.
 *
 * Provides thread-safe, in-process rate limiting suitable for single-node
 * deployments and local development. Fully compatible with IRateLimiter contract
 * for future zero-friction Redis replacement.
 */
export class MemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, RateLimitRecord>();

  async consume(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out expired timestamps
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0];
      const resetTime = new Date(oldestInWindow + windowMs);
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((resetTime.getTime() - now) / 1000)
      );

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfterSeconds,
      };
    }

    // Record this attempt
    record.timestamps.push(now);

    const resetTime = new Date(now + windowMs);
    const remaining = limit - record.timestamps.length;

    return {
      allowed: true,
      limit,
      remaining,
      resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Cleans up all entries in the store (useful for tests or periodic maintenance)
   */
  clear(): void {
    this.store.clear();
  }
}

export const rateLimiter = new MemoryRateLimiter();
