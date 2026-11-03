import { describe, expect, it } from "vitest";

import {
  normalizeGpa,
  normalizeGre,
  normalizePce,
  parseOptionalNumber,
} from "@/lib/predictor/normalize";

describe("normalizeGpa", () => {
  it("maps 2.7 → 0 and 4.0 → 1", () => {
    expect(normalizeGpa(2.7)).toBe(0);
    expect(normalizeGpa(4)).toBe(1);
  });

  it("clamps out-of-range values", () => {
    expect(normalizeGpa(2)).toBe(0);
    expect(normalizeGpa(5)).toBe(1);
  });
});

describe("normalizePce", () => {
  it("maps 0 → 0 and cap → 1", () => {
    expect(normalizePce(0)).toBe(0);
    expect(normalizePce(10_000)).toBe(1);
  });

  it("clamps above the cap", () => {
    expect(normalizePce(50_000)).toBe(1);
  });
});

describe("normalizeGre", () => {
  it("maps 270 → 0 and 330 → 1", () => {
    expect(normalizeGre(270)).toBe(0);
    expect(normalizeGre(330)).toBe(1);
  });

  it("clamps out-of-range values", () => {
    expect(normalizeGre(200)).toBe(0);
    expect(normalizeGre(400)).toBe(1);
  });
});

describe("parseOptionalNumber", () => {
  it("returns null for empty or invalid input", () => {
    expect(parseOptionalNumber(null)).toBeNull();
    expect(parseOptionalNumber(undefined)).toBeNull();
    expect(parseOptionalNumber("")).toBeNull();
    expect(parseOptionalNumber("  ")).toBeNull();
    expect(parseOptionalNumber("abc")).toBeNull();
  });

  it("parses finite numbers", () => {
    expect(parseOptionalNumber(3.5)).toBe(3.5);
    expect(parseOptionalNumber("3.50")).toBe(3.5);
  });
});
