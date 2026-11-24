// Must stay the first import so env vars are loaded before other modules read them.
import "dotenv/config";

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./database.js"
import { APIError } from "better-auth/api";
import { emailOTP, customSession } from "better-auth/plugins";
import { emailtype, sendOTPEmail } from './../service/email.service.js';
import type { PlatformRole } from "../../../generated/prisma/enums.js";
import { createAuthSessionResponse } from '../service/auth-session.service.js';
import { createMembershipForUser, getMembershipForUser } from '../service/membership.service.js';
import { assertUserShopAccess } from '../../shop/shop-access.service.js';
import { AppError } from '../../../error/app-error.js';

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
    throw new Error(
        "BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set in the environment variables",
    );
}
// FRONTEND_URL can hold several origins, comma-separated (same format app.ts uses for CORS).
const trustedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const auth = betterAuth({
    appName: "pharmaErp",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        requireEmailVerification: true,
    },
    user: {
        additionalFields: {
            // Maps to the PlatformRole enum; never settable from client input.
            role: {
                type: "string",
                required: false,
                input: false,
            },
            phoneNumber: { type: "string", required: false },
            address: { type: "string", required: false },
            dateOfBirth: { type: "date", required: false },
        },
    },
    databaseHooks: {
        session: {
            create: {
                // Blocked or deleted shops cannot start a session at all.
                before: async (session) => {
                    try {
                        await assertUserShopAccess(session.userId);
                    } catch (error) {
                        if (error instanceof AppError) {
                            throw new APIError("FORBIDDEN", {
                                code: error.code,
                                message: error.message,
                            });
                        }
                        throw error;
                    }
                },
            },
        },
        user: {
            create: {
                after: async (user) => {
                    await createMembershipForUser(
                        user.id,
                        (user.role as PlatformRole | undefined) ?? "STAFF",
                    );
                },
            },
        },
    },
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            sendVerificationOnSignUp: true,
            storeOTP: "hashed",
            // Not awaited: awaiting makes response time reveal whether the email exists.
            async sendVerificationOTP({ email, otp, type }: emailtype) {
                void sendOTPEmail({ email, otp, type }).catch((error) => {
                    console.error(`[EMAIL OTP] Failed to send ${type} email:`, error);
                });
            }
        }),
        customSession(async ({ user, session }) => {
            const membership = await getMembershipForUser(user.id);
            return createAuthSessionResponse({
                user,
                session,
                membership,
            })
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