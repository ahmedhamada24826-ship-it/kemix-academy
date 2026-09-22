import { describe, it, expect } from "vitest";
import { normalizeEmail, emailSchema } from "./email-normalizer";

describe("Email Normalizer", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeEmail("   student@kemix.academy   ")).toBe("student@kemix.academy");
  });

  it("converts uppercase and mixed-case emails to lowercase", () => {
    expect(normalizeEmail("ADMIN@KEMIX.ACADEMY")).toBe("admin@kemix.academy");
    expect(normalizeEmail("Instructor.Data@Kemix.Academy")).toBe("instructor.data@kemix.academy");
  });

  it("handles whitespace and casing simultaneously", () => {
    expect(normalizeEmail("  USER.NAME@Domain.COM  ")).toBe("user.name@domain.com");
  });

  it("handles empty or invalid inputs gracefully", () => {
    expect(normalizeEmail("")).toBe("");
    expect(normalizeEmail(null as unknown as string)).toBe("");
  });

  it("validates and normalizes via emailSchema Zod validator", () => {
    const parsed = emailSchema.safeParse("   Student@Kemix.Academy  ");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toBe("student@kemix.academy");
    }

    const invalid = emailSchema.safeParse("not-an-email");
    expect(invalid.success).toBe(false);
  });
});
