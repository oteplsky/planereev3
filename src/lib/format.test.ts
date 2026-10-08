import { describe, expect, it } from "vitest";
import { count, formatDate, LESSONS, plural } from "./format";

describe("plural", () => {
  it.each([
    [1, "урок"], [2, "урока"], [4, "урока"], [5, "уроков"], [11, "уроков"],
    [12, "уроков"], [14, "уроков"], [21, "урок"], [22, "урока"], [0, "уроков"],
  ])("%i → %s", (n, form) => {
    expect(plural(n, LESSONS)).toBe(form);
  });

  it("count", () => expect(count(3, LESSONS)).toBe("3 урока"));
});

describe("formatDate", () => {
  const now = new Date(2026, 9, 8, 18, 0); // 8 Oct 2026, local time

  it("relative days", () => {
    expect(formatDate(new Date(2026, 9, 8, 9, 0).toISOString(), now)).toBe("сегодня");
    expect(formatDate(new Date(2026, 9, 7, 23, 0).toISOString(), now)).toBe("вчера");
  });

  it("day and month this year, with year otherwise", () => {
    expect(formatDate(new Date(2026, 9, 5, 12).toISOString(), now)).toBe("5 октября");
    expect(formatDate(new Date(2025, 11, 31, 12).toISOString(), now)).toMatch(/^31 декабря 2025/);
  });
});
