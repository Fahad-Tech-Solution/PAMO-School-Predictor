import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.");

/** Used when setting or resetting a password. */
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

/** Login accepts existing passwords; strength is enforced on reset/create. */
export const loginPasswordSchema = z
  .string()
  .min(1, "Enter your password.");

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
