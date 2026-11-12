import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  PUBLIC_WEB_URL: z.url(),
  PUBLIC_ADMIN_URL: z.url(),
  // Secret: connection for the tenant role (API.md Section 11). Never logged.
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Secret: signs session cookies (API.md Section 11). Never logged.
  BETTER_AUTH_SECRET: z.string().min(32),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive(),
  SESSION_ABSOLUTE_TIMEOUT_HOURS: z.coerce.number().int().positive(),
  // Sign-in lockout (PRD NFR-SEC-03). Defaults confirmed by the owner on 2026-11-12.
  LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  // Sign-in throttle per IP and email (API.md Section 8).
  RATE_LIMIT_SIGN_IN_PER_MINUTE: z.coerce.number().int().positive().default(5),
  // Comma-separated explicit origins; a wildcard is never accepted.
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1))
    .refine((origins) => !origins.includes("*"), "Wildcard origins are not allowed"),
});

export type Env = z.infer<typeof envSchema>;

// Fails fast on missing or invalid configuration and reports variable NAMES only,
// never their values (ARCHITECTURE 11.2).
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "?")))];
    throw new Error(`Invalid environment configuration. Check: ${names.join(", ")}`);
  }
  return result.data;
}
