import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireUser } from "@/lib/dal";
import { SUPER_ADMIN_AREA_PERMISSION, hasPermission } from "@/lib/permissions";

export const metadata = { title: "No access | Pharma ERP" };

async function ForbiddenContent() {
  const session = await requireUser();
  // Someone who does have access has no reason to be here.
  if (hasPermission(session.membership?.permissions ?? {}, SUPER_ADMIN_AREA_PERMISSION)) {
    redirect("/dashboard");
  }

  return (
    <AuthCard title="No access yet" subtitle="Your account doesn't have a dashboard available right now.">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Please contact your administrator if you think this is a mistake.
      </p>
      <SignOutButton />
    </AuthCard>
  );
}

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <ForbiddenContent />
      </Suspense>
    </main>
  );
}
