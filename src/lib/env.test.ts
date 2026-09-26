import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("environment configuration", () => {
  it("uses default S3 buckets when environment values are blank", async () => {
    vi.stubEnv("S3_PUBLIC_BUCKET", "");
    vi.stubEnv("S3_PRIVATE_BUCKET", "   ");
    vi.resetModules();

    const { env } = await import("./env");

    expect(env.S3_PUBLIC_BUCKET).toBe("kemix-academy-public");
    expect(env.S3_PRIVATE_BUCKET).toBe("kemix-academy-protected");
  });
});