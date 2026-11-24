"use client";

import { useSyncExternalStore } from "react";

// While a sign-in code is pending there is no session, so the OTP page cannot ask the server
// who is signing in. Only the MASKED email is kept (tab-only storage) to show "sent to d***@x.com".
const KEY = "pending-otp-email";

export function savePendingOtpEmail(maskedEmail: string) {
  try {
    sessionStorage.setItem(KEY, maskedEmail);
  } catch {
    // Storage can be unavailable (private mode). The page then shows "your email".
  }
}

export function clearPendingOtpEmail() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

const subscribe = () => () => {};
const read = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

/** Masked email of the pending sign-in, or null. Null on the server and during hydration. */
export function usePendingOtpEmail(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
