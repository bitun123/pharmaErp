"use client";

import { Loader2, LogOut } from "lucide-react";
import { useSignOut } from "@/features/auth/hooks/useHooks";

export function SignOutButton() {
  const signOut = useSignOut();

  return (
    <button
      type="button"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {signOut.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Sign out
    </button>
  );
}
