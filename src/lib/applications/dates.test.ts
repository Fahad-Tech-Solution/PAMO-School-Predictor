import { describe, expect, it } from "vitest";

import {
  formatDateInput,
  formatDateOnly,
  parseDateOnlyInput,
} from "@/lib/applications/dates";

describe("parseDateOnlyInput", () => {
  it("parses YYYY-MM-DD to UTC noon", () => {
    const date = parseDateOnlyInput("2025-10-19");
    expect(date?.toISOString()).toBe("2025-10-19T12:00:00.000Z");
  });

  it("returns null for blank or invalid", () => {
    expect(parseDateOnlyInput("")).toBeNull();
    expect(parseDateOnlyInput("  ")).toBeNull();
    expect(parseDateOnlyInput("10/19/2025")).toBeNull();
    expect(parseDateOnlyInput("not-a-date")).toBeNull();
  });
});

describe("formatDateInput", () => {
  it("formats dates for input[type=date]", () => {
    expect(formatDateInput(new Date("2025-10-19T12:00:00.000Z"))).toBe(
      "2025-10-19",
    );
    expect(formatDateInput(null)).toBe("");
  });
});

describe("formatDateOnly", () => {
  it("renders a readable date or dash", () => {
    expect(formatDateOnly(new Date("2025-10-19T12:00:00.000Z"))).toContain(
      "2025",
    );
    expect(formatDateOnly(null)).toBe("—");
  });
});
