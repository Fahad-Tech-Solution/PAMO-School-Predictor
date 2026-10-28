import { z } from "zod";

/** Supported GPA range: 2.70 → 4.00 */
export const gpaSchema = z
  .number()
  .min(2.7, "GPA must be at least 2.70")
  .max(4.0, "GPA must be at most 4.00");

export const optionalGpaSchema = gpaSchema.nullable().optional();
