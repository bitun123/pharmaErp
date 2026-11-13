
import { logger } from "better-auth";
import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === "true",

  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

export async function verifyMailConnection() {
  try {
    await mailTransporter.verify();

    logger.info("Mailpit SMTP connected successfully");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);

    logger.error("Mailpit SMTP connection failed:", message);

    throw error;
  }
}
