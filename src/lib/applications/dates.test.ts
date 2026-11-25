import { describe, expect, it } from "vitest";

import {
  coerceDateOnly,
  formatDateInput,
  formatDateOnly,
  parseDateOnlyInput,
  parseUsDateInput,
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

describe("parseUsDateInput", () => {
  it("parses American mm/dd/yyyy to UTC noon", () => {
    expect(parseUsDateInput("10/19/2025")?.toISOString()).toBe(
      "2025-10-19T12:00:00.000Z",
    );
    expect(parseUsDateInput("6/30/2026")?.toISOString()).toBe(
      "2026-06-30T12:00:00.000Z",
    );
  });

  it("rejects impossible or non-American dates", () => {
    expect(parseUsDateInput("02/31/2026")).toBeNull();
    expect(parseUsDateInput("2026-06-30")).toBeNull();
    expect(parseUsDateInput("")).toBeNull();
  });
});

describe("coerceDateOnly", () => {
  it("accepts American, ISO, YYYY-MM-DD, and Date instances", () => {
    expect(coerceDateOnly("06/30/2026")?.toISOString()).toBe(
      "2026-06-30T12:00:00.000Z",
    );
    expect(coerceDateOnly("2026-06-30")?.toISOString()).toBe(
      "2026-06-30T12:00:00.000Z",
    );
    expect(coerceDateOnly("2026-08-28T12:00:00.000Z")?.toISOString()).toBe(
      "2026-08-28T12:00:00.000Z",
    );
    expect(
      coerceDateOnly(new Date("2026-11-23T12:00:00.000Z"))?.toISOString(),
    ).toBe("2026-11-23T12:00:00.000Z");
  });

  it("returns null for blank or invalid", () => {
    expect(coerceDateOnly("")).toBeNull();
    expect(coerceDateOnly(null)).toBeNull();
    expect(coerceDateOnly("not-a-date")).toBeNull();
    expect(coerceDateOnly(new Date("invalid"))).toBeNull();
  });
});

describe("formatDateInput", () => {
  it("formats dates as mm/dd/yyyy for American form inputs", () => {
    expect(formatDateInput(new Date("2025-10-19T12:00:00.000Z"))).toBe(
      "10/19/2025",
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
