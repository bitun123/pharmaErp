import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { logger } from "../../../config/logger.js";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

//single  instance of PrismaClient to be used throughout the application
export const prisma = new PrismaClient({ adapter });

//testing the connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error({ err: error }, "Database connection failed");
    process.exit(1);
  }
};