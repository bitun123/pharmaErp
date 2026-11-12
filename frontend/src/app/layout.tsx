import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@pharma/ui/styles.css";

export const metadata: Metadata = {
  title: "Pharma ERP",
  description: "Pharmacy management platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="ui-skip-link" href="#main">
          Skip to content
        </a>
        <main id="main" style={{ padding: "var(--space-8)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
