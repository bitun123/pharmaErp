import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OtpForm } from "@/components/auth/otp-form";
import { getSession } from "@/lib/dal";

// Someone who is already signed in has no code to enter.
async function OtpGate() {
  const session = await getSession();
  if (session?.user.emailVerified) redirect("/dashboard");
  return <OtpForm />;
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={null}>
      <OtpGate />
    </Suspense>
  );
}
