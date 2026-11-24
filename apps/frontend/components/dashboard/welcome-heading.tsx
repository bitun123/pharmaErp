export function WelcomeHeading({ name }: { name: string }) {
  const trimmed = name.trim();

  return (
    <h1 className="min-w-0 truncate border-l-2 border-primary pl-3 text-sm font-semibold tracking-tight sm:text-base">
      {trimmed ? `Welcome back, ${trimmed}` : "Welcome back"}
    </h1>
  );
}
