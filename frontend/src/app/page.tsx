import { Button } from "@pharma/ui";

// Placeholder landing page for the project foundation. Real screens are built in later
// phases following DESIGN.md.
export default function HomePage() {
  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Pharma ERP</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Project foundation is ready. Feature screens are added phase by phase.
      </p>
      <Button variant="secondary">Design system check</Button>
    </section>
  );
}
