import Link from "next/link";

export default function NotFound() {
  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Page not found</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        This page doesn&apos;t exist or isn&apos;t available to you.
      </p>
      <Link href="/">Go to the home page</Link>
    </section>
  );
}
