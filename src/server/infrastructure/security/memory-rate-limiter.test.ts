import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRateLimiter } from "./memory-rate-limiter";

describe("MemoryRateLimiter", () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter();
  });

  it("allows requests within the configured limit", async () => {
    const key = "test:ip:1";
    const limit = 3;
    const windowSeconds = 60;

    const r1 = await limiter.consume(key, limit, windowSeconds);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.consume(key, limit, windowSeconds);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await limiter.consume(key, limit, windowSeconds);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests once the limit is exceeded and provides retryAfterSeconds", async () => {
    const key = "test:ip:2";
    const limit = 2;
    const windowSeconds = 10;

    await limiter.consume(key, limit, windowSeconds);
    await limiter.consume(key, limit, windowSeconds);

    const r3 = await limiter.consume(key, limit, windowSeconds);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterSeconds).toBeDefined();
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates rate limits between distinct keys", async () => {
    const keyA = "test:ip:A";
    const keyB = "test:ip:B";
    const limit = 1;
    const windowSeconds = 60;

    const resA1 = await limiter.consume(keyA, limit, windowSeconds);
    expect(resA1.allowed).toBe(true);

    const resA2 = await limiter.consume(keyA, limit, windowSeconds);
    expect(resA2.allowed).toBe(false);

    // keyB should still be allowed
    const resB1 = await limiter.consume(keyB, limit, windowSeconds);
    expect(resB1.allowed).toBe(true);
  });

  it("resets rate limit for a key when reset is called", async () => {
    const key = "test:ip:reset";
    const limit = 1;
    const windowSeconds = 60;

    await limiter.consume(key, limit, windowSeconds);
    const blocked = await limiter.consume(key, limit, windowSeconds);
    expect(blocked.allowed).toBe(false);

    await limiter.reset(key);

    const afterReset = await limiter.consume(key, limit, windowSeconds);
    expect(afterReset.allowed).toBe(true);
  });

  it("allows new requests after sliding window expires", async () => {
    vi.useFakeTimers();
    try {
      const key = "test:ip:sliding";
      const limit = 2;
      const windowSeconds = 10;

      await limiter.consume(key, limit, windowSeconds);
      await limiter.consume(key, limit, windowSeconds);

      const blocked = await limiter.consume(key, limit, windowSeconds);
      expect(blocked.allowed).toBe(false);

      // Advance time beyond the window
      vi.advanceTimersByTime(11000);

      const allowedAgain = await limiter.consume(key, limit, windowSeconds);
      expect(allowedAgain.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
