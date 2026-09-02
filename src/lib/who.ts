import type { Person } from "@/lib/types";

const ALIASES: Record<string, string> = {
  me: "pat",
  pat: "pat",
  pam: "pam",
};

export function resolveWho(
  raw: string | undefined | null,
  people: Pick<Person, "id" | "name">[],
): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  const aliased = ALIASES[key] ?? key;
  const hit =
    people.find((p) => p.id === aliased) ??
    people.find((p) => p.id === key) ??
    people.find((p) => p.name.toLowerCase() === key);
  return hit?.id ?? null;
}
