import { describe, it, expect } from "vitest";
import { generateRawSessionToken, hashSessionToken } from "./session-token";

describe("Session Token Security", () => {
  it("generates a random, non-empty, URL-safe base64 string", () => {
    const token1 = generateRawSessionToken();
    const token2 = generateRawSessionToken();

    expect(token1).toBeDefined();
    expect(typeof token1).toBe("string");
    expect(token1.length).toBeGreaterThanOrEqual(40);
    expect(token1).not.toBe(token2);
  });

  it("hashes session token deterministically with SHA-256", () => {
    const rawToken = "test_raw_session_token_1234567890";
    const hash1 = hashSessionToken(rawToken);
    const hash2 = hashSessionToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 64 hex characters for SHA-256
    expect(hash1).not.toBe(rawToken);
  });

  it("produces distinct hashes for different raw tokens", () => {
    const hash1 = hashSessionToken("token_alpha");
    const hash2 = hashSessionToken("token_beta");

    expect(hash1).not.toBe(hash2);
  });
});
