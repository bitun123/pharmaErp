"use client";

import { Button } from "@pharma/ui";

// Error boundary: states what is known and offers a retry (DESIGN.md 10.8).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" style={{ maxWidth: 720 }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        The page could not be shown. Try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
