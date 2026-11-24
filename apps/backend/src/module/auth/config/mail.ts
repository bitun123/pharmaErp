import nodemailer from "nodemailer";
import { logger } from "../../../config/logger.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * The one SMTP transport for the whole backend. Real emails (email.service.ts) and the
 * startup check below both use it, so the check tests exactly what sending will use.
 * Defaults point at a local Mailpit instance; override with the SMTP_* env vars.
 */
export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  tls: { rejectUnauthorized: isProduction },

  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

export async function verifyMailConnection() {
  try {
    await mailTransporter.verify();
    logger.info("SMTP server connected successfully");
  } catch (error: unknown) {
    logger.error({ err: error }, "SMTP connection failed");
    throw error;
  }
}