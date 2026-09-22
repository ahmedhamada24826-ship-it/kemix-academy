import { describe, it, expect } from "vitest";
import { Argon2Hasher } from "./argon2-hasher";

describe("Argon2Hasher", () => {
  const hasher = new Argon2Hasher();

  it("hashes a plain-text password using Argon2id", async () => {
    const plainText = "StrongP@ssw0rd!2026";
    const hash = await hasher.hash(plainText);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(plainText);
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("verifies a correct password against its stored hash", async () => {
    const plainText = "SecureDataAnalysis#2026";
    const hash = await hasher.hash(plainText);

    const isValid = await hasher.verify(hash, plainText);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const plainText = "CorrectPassword!123";
    const wrongPassword = "WrongPassword!999";
    const hash = await hasher.hash(plainText);

    const isValid = await hasher.verify(hash, wrongPassword);
    expect(isValid).toBe(false);
  });

  it("gracefully rejects malformed or invalid hash strings without throwing", async () => {
    const isValid = await hasher.verify("not-a-valid-argon2-hash", "password");
    expect(isValid).toBe(false);
  });
});
