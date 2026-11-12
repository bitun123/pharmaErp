import { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";
import type { Env } from "../config/env.ts";

// Only repositories may use this client (ARCHITECTURE 8.1). The URL comes from the
// validated environment, never from process.env directly.
export function createPrismaClient(env: Pick<Env, "DATABASE_URL">): PrismaClient {
  return new PrismaClient({ datasourceUrl: env.DATABASE_URL });
}

// Fails fast at start-up if the database is unreachable.
export async function connectDatabase(prisma: PrismaClient, logger: Logger): Promise<void> {
  await prisma.$connect();
  logger.info("Database connected");
}

export async function disconnectDatabase(prisma: PrismaClient, logger: Logger): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}

// Readiness probe (API.md 6.13): one trivial query proves the database is reachable.
export async function checkDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
