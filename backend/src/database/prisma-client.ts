
import  {PrismaClient} from "@prisma/client";
import type { Logger } from "pino";
import { env, type Env } from "../config/env.ts";


export function createPrismaClient(envConfig: Pick<Env, "DATABASE_URL">): PrismaClient {
return  new PrismaClient({
  datasourceUrl: envConfig.DATABASE_URL,
})
}

//single  shared instance of prisma client

export const prisma = createPrismaClient(env);

export async function connectDatabase(prismaClient: PrismaClient, logger: Logger): Promise<void> {
  await prismaClient.$connect();
  logger.info("Connected to the database");
}

export async function disconnectDatabase(prismaClient: PrismaClient, logger: Logger): Promise<void> {
  await prismaClient.$disconnect();
  logger.info("Disconnected from the database");
}

export async function checkDatabase(prismaClient: PrismaClient): Promise<void> {
  await prismaClient.$queryRaw`SELECT 1`;
}