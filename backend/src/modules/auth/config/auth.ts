
import dotenv from "dotenv";
dotenv.config();
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { sendOTPEmail } from "../service/email.service.js";
import { emailOTP } from "better-auth/plugins";
import { Prisma } from "@prisma/client";
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
  throw new Error(
    "BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set in the environment variables",
  );
}


export const auth = betterAuth({
  appName: "Better Auth",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(Prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
    user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        input: true,
      },

      dateOfBirth: {
        type: "date",
        required: false,
        input: true,
      },

      address: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,

      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      storeOTP: "hashed",

      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[EMAIL OTP] Sending ${type} to ${email}`);

        await sendOTPEmail({ email, otp });

        console.log(`[EMAIL OTP] Email delivered to Mailpit for ${email}`);
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    freshAge: 60 * 60 * 24, // 1 day
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
    },
  },

  advanced: {
    // DEV ONLY: skips the Origin/CSRF check so Postman works without an Origin header
    disableCSRFCheck: !isProduction,
  },
});
