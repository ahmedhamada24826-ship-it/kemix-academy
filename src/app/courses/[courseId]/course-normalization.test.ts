import { describe, expect, it } from "vitest";
import { normalizeCourseList } from "./course-normalization";

describe("normalizeCourseList", () => {
  it("converts newline-delimited requirement strings into arrays", () => {
    expect(normalizeCourseList("First requirement\nSecond requirement\nThird requirement")).toEqual([
      "First requirement",
      "Second requirement",
      "Third requirement",
    ]);
  });

  it("keeps valid array values unchanged", () => {
    expect(normalizeCourseList(["One", "Two"])).toEqual(["One", "Two"]);
  });

  it("returns an empty array for nullish values", () => {
    expect(normalizeCourseList(null)).toEqual([]);
    expect(normalizeCourseList(undefined)).toEqual([]);
  });
});
