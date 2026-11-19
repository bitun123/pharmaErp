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

export interface SendShopAdminCredentialsEmailInput {
    email: string;
    name: string;
    shopName: string;
    password?: string;
    setupUrl?: string;
}

export async function sendShopAdminWelcomeEmail({
    email,
    name,
    shopName,
    password,
    setupUrl,
}: SendShopAdminCredentialsEmailInput) {
    const publicWebUrl = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/+$/, "");
    const loginUrl = `${publicWebUrl}/sign-in`;

    try {
        if (password) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: `Welcome to ${shopName} - Your Admin Credentials`,
                text: `Hello ${name},\n\nYou have been registered as the administrator for ${shopName}.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nLogin here: ${loginUrl}\n\nPlease change your password after logging in.`,
                html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1c19; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #bfc9c0; border-radius: 8px;">
            <h2 style="color: #005131;">Welcome to ${shopName}!</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>You have been assigned as the administrator for <strong>${shopName}</strong> on the Pharma ERP platform.</p>
            <div style="background: #f9faf5; border-left: 4px solid #005131; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0;"><strong>Admin Email:</strong> ${email}</p>
              <p style="margin: 0;"><strong>Initial Password:</strong> <code style="background: #edeee9; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: bold;">${password}</code></p>
            </div>
            <p><a href="${loginUrl}" style="background-color: #005131; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In to Portal &rarr;</a></p>
            <p style="font-size: 13px; color: #6f7a71; margin-top: 24px;">For security reasons, please change your password upon your first sign-in.</p>
          </div>
        `,
            });
        } else if (setupUrl) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: `Welcome to ${shopName} - Set Up Your Admin Account`,
                text: `Hello ${name},\n\nYou have been assigned as the administrator for ${shopName}.\n\nPlease set your account password by visiting the link below:\n${setupUrl}\n\nThis setup link will expire in 48 hours.`,
                html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1c19; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #bfc9c0; border-radius: 8px;">
            <h2 style="color: #005131;">Welcome to ${shopName}!</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>You have been assigned as the administrator for <strong>${shopName}</strong> on the Pharma ERP platform.</p>
            <p>To activate your account and start managing your pharmacy, please click the button below to choose your password:</p>
            <p><a href="${setupUrl}" style="background-color: #005131; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Set Up Password &rarr;</a></p>
            <p style="font-size: 13px; color: #6f7a71; margin-top: 20px;">Or copy and paste this link into your browser:<br/><a href="${setupUrl}" style="color: #005131;">${setupUrl}</a></p>
            <p style="font-size: 12px; color: #6f7a71;">This link will expire in 48 hours.</p>
          </div>
        `,
            });
        }
    } catch (error) {
        console.warn(`[EMAIL WARNING] Could not send welcome email to ${email}:`, (error as any)?.message || error);
    }
}
