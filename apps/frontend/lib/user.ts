/** "Alex Morgan" -> "AM"; falls back to "?" for empty or missing names. */
export function getInitials(name?: string | null) {
  const parts = (name ?? "").replace(/^Dr\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/** "super_admin" / "super-admin" -> "Super Admin"; "" -> "Member". */
export function formatRole(role?: string | null) {
  const clean = (role ?? "").replace(/[_-]+/g, " ").trim();
  if (!clean) return "Member";
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}
