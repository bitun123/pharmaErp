
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1025,
    secure: false,
})

export interface emailtype {
    email: string,
    otp: string,
    type:
    | "sign-in"
    | "email-verification"
    | "forget-password"
    | "change-email";
}

export async function sendOTPEmail({ email, otp, type }: emailtype) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Your email verification OTP",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `
      <h2>Email Verification</h2>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `,
    });
}