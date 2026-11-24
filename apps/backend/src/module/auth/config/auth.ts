// Must stay the first import so env vars are loaded before other modules read them.
import "dotenv/config";

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./database.js"
import { APIError } from "better-auth/api";
import { emailOTP, customSession, twoFactor } from "better-auth/plugins";
import { emailtype, sendOTPEmail } from './../service/email.service.js';
import { createAuthSessionResponse } from '../service/auth-session.service.js';
import { createMembershipForUser, getMembershipForUser } from '../service/membership.service.js';
import { assertUserShopAccess } from '../../shop/shop-access.service.js';
import { AppError } from '../../../error/app-error.js';
import { logger } from '../../../config/logger.js';

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
                // Every account needs the emailed sign-in code. Better Auth's own default is false
                // and the field cannot be set from client input.
                before: async (user) => ({ data: { ...user, twoFactorEnabled: true } }),
                after: async (user) => {
                    // Every self-created account starts with the least-privileged role.
                    // Higher roles are only ever granted server-side (e.g. when a shop is created).
                    await createMembershipForUser(user.id, "STAFF");
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
                    logger.error({ err: error, type }, "Failed to send OTP email");
                });
            }
        }),
        // Sign-in code: after a correct password NO session is created. Only a short-lived
        // "code pending" cookie is issued, and the session starts once /two-factor/verify-otp
        // succeeds. Users who already hold a valid session are not asked again.
        twoFactor({
            totpOptions: { disable: true },
            otpOptions: {
                period: 5, // minutes, matches the "expires in 5 minutes" email text
                digits: 6,
                allowedAttempts: 3,
                storeOTP: "hashed",
                // Not awaited: awaiting makes response time reveal whether the email exists.
                async sendOTP({ user, otp }) {
                    void sendOTPEmail({ email: user.email, otp, type: "sign-in" }).catch((error) => {
                        logger.error({ err: error, type: "sign-in" }, "Failed to send OTP email");
                    });
                },
            },
        }),
        customSession(async ({ user, session }) => {
            const membership = await getMembershipForUser(user.id);
            return createAuthSessionResponse({
                user,
                session,
                membership,
            })
        }),],
    // The code requirement is mandatory: users must not be able to switch it off or set up
    // authenticator apps / backup codes on their own.
    disabledPaths: [
        "/two-factor/enable",
        "/two-factor/disable",
        "/two-factor/get-totp-uri",
        "/two-factor/verify-totp",
        "/two-factor/generate-backup-codes",
        "/two-factor/verify-backup-code",
    ],
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