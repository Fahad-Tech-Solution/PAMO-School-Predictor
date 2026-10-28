import { z } from "zod";

import { emailSchema } from "@/lib/validation/auth";

export const userRoleValues = ["ADMIN", "VIEWER"] as const;

const optionalName = z
  .string()
  .trim()
  .max(120, "Name is too long.")
  .transform((value) => value);

export const provisionUserSchema = z.object({
  email: emailSchema,
  name: optionalName,
  role: z.enum(userRoleValues),
});

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: optionalName,
  role: z.enum(userRoleValues),
  isActive: z.boolean(),
});

export type ProvisionUserValues = z.infer<typeof provisionUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
