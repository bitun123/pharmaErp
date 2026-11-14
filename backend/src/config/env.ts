import dotenv from "dotenv";
dotenv.config();
export interface Env {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

function validateEnv() : Env {
    const databaseUrl = process.env.DATABASE_URL;
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:8080";

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  if (!betterAuthSecret) {
    throw new Error("Missing required environment variable: BETTER_AUTH_SECRET");
  }
  return {
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
  };
}

export const env: Env = validateEnv();