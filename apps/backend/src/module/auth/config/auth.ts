import { emailtype, sendOTPEmail } from './../service/email.service.js';
import dotenv from "dotenv";
dotenv.config()

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./database.js"
import { emailOTP } from "better-auth/plugins";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
    throw new Error(
        "BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set in the environment variables",
    );
}
const trustedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

export const auth = betterAuth({
    appName: "pharmaErp",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,

    },
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            sendVerificationOnSignUp: true,
            storeOTP: "hashed",
            async sendVerificationOTP({ email, otp, type }: emailtype) {
                console.log(`[EMAIL OTP] Sending ${type} to ${email}`);
                await sendOTPEmail({ email, otp, type })
                console.log(`[EMAIL OTP] Email delivered to Mailpit for ${email}`);
            }
        }),],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24, // 1 day
        freshAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
        // DEV ONLY: skips the Origin/CSRF check so Postman works without an Origin header
        disableCSRFCheck: !isProduction,
    },
})