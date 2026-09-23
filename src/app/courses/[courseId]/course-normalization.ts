export function normalizeCourseList(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|•\s*|\s*[-*]\s*/)
    .map((item) => item.replace(/^[\d.\s]+/, "").trim())
    .filter(Boolean);
}
