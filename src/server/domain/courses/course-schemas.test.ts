import { describe, expect, it } from "vitest";
import { UpdateCourseSchema } from "./course-schemas";

describe("UpdateCourseSchema", () => {
  it("preserves co-instructor ids in course updates", () => {
    const coInstructorIds = ["de305d54-75b4-431b-adb2-eb6b9e546014"];

    const result = UpdateCourseSchema.safeParse({ coInstructorIds });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.coInstructorIds).toEqual(coInstructorIds);
  });
});