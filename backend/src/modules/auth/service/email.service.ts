import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
});
type OTPType = "sign-in" | "email-verification" | "forget-password" | "change-email";

interface SendOTPEmailOptions {
  email: string;
  otp: string;
  type: OTPType;
}

export async function sendOTPEmail({
  email,
  otp,
  type,
}: SendOTPEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Pharma ERP Verification OTP",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div>
        <h2>Pharma ERP Verification</h2>
        <h1>${otp}</h1>
        <p>Purpose: ${type}</p>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `,
  });
}