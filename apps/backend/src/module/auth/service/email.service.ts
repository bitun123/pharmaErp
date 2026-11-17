import nodemailer from "nodemailer";

const isProduction = process.env.NODE_ENV === "production";

// Defaults point at a local Mailpit instance; override via SMTP_* env vars elsewhere.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    tls: { rejectUnauthorized: isProduction },
})

export interface emailtype {
    email: string,
    otp: string,
    type:
    |"sign-up"
    | "sign-in"
    | "email-verification"
    | "forget-password"
    | "change-email";
}

const subjects: Record<emailtype["type"], string> = {
    "sign-up": "Verify your email",
    "email-verification": "Verify your email",
    "sign-in": "Your sign-in code",
    "forget-password": "Reset your password",
    "change-email": "Confirm your new email",
};

export async function sendOTPEmail({ email, otp, type }: emailtype) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: subjects[type] ?? "Your verification code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `
      <h2>${subjects[type] ?? "Verification code"}</h2>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `,
    });
}
