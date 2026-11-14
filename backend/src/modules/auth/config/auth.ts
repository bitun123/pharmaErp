import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { sendOTPEmail } from "../service/email.service.ts";
import { prisma } from "../../../database/prisma-client.ts";
import { env } from "../../../config/env.ts";

export const auth = betterAuth({
  appName: "PharmaErp",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL, // Fixed: was 'url'

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 5 * 60, // Fixed: 300 seconds (5 minutes), not milliseconds
      allowedAttempts: 5,
      disableSignUp: false,
      sendVerificationOnSignUp: true, // 👈 Automatically sends OTP on /sign-up/email
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail({ email, otp, type });
      },
    }),
  ],

  user: {
    modelName: "PlatformUser",
    fields: {
      name: "fullName",
    },
  },
  session: {
    modelName: "PlatformSession",
  },
  account: {
    modelName: "PlatformAccount",
  },
  verification: {
    modelName: "PlatformVerification",
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});