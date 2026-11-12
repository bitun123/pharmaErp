import { z } from "zod";

// Upper bounds protect the hashing step from oversized input. No password complexity
// rule applies at sign-in: the policy is enforced when a password is set (OQ-19).
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MAX_LENGTH = 128;

export const signInRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(EMAIL_MAX_LENGTH).pipe(z.email()),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const PLATFORM_USER_KINDS = ["super_admin", "platform_admin"] as const;

// Never contains tokens or credentials: the session travels only in the cookie (API.md 4.1).
export const platformSignInResponseSchema = z.object({
  user: z.object({
    id: z.uuid(),
    email: z.string(),
    fullName: z.string(),
    kind: z.enum(PLATFORM_USER_KINDS),
  }),
});
export type PlatformSignInResponse = z.infer<typeof platformSignInResponseSchema>;
