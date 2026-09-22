import { describe, it, expect } from "vitest";
import { validatePassword, passwordSchema } from "./password-policy";

describe("Password Policy", () => {
  it("accepts passwords fulfilling all security criteria", () => {
    const validPasswords = [
      "AdminPass123!",
      "K3m!xAc@demy2026",
      "P@ssw0rd$tr0ng#",
      "SuperDataScientist#2026",
    ];

    for (const pwd of validPasswords) {
      const result = validatePassword(pwd);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = validatePassword("Sh0rt!");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 8 characters");
  });

  it("rejects passwords missing uppercase letters", () => {
    const result = validatePassword("lowercase123!");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("uppercase");
  });

  it("rejects passwords missing lowercase letters", () => {
    const result = validatePassword("UPPERCASE123!");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lowercase");
  });

  it("rejects passwords missing numbers", () => {
    const result = validatePassword("NoNumbersHere!");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("number");
  });

  it("rejects passwords missing special characters", () => {
    const result = validatePassword("NoSpecialChars123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("special character");
  });

  it("validates directly via passwordSchema Zod schema", () => {
    expect(passwordSchema.safeParse("ValidPass1!").success).toBe(true);
    expect(passwordSchema.safeParse("invalid").success).toBe(false);
  });
});
