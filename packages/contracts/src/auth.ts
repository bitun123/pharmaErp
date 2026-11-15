import { z } from "zod";

/**
 * Sign-in request validation schema shared between backend and frontend.
 * Accepts either a valid email address or a 10-digit National Provider Identifier (NPI).
 */
export const signInSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Professional Email or 10-digit NPI is required.")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isNPI = /^\d{10}$/.test(val);
        return isEmail || isNPI;
      },
      {
        message: "Enter a valid email address (e.g. dr.smith@pharma.com) or a 10-digit NPI.",
      }
    ),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters."),
});

export type SignInFormData = z.infer<typeof signInSchema>;
