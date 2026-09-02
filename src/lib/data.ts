import roster from "../../public/people.json";
import { isPerson, isWorkout, type Person, type Workout } from "@/lib/types";

export const bundledPeople: Person[] = Array.isArray(roster.people)
  ? roster.people.filter(isPerson)
  : [];

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`NO FILE: ${url}`);
  return res.json();
}

export async function loadPeople(): Promise<Person[]> {
  try {
    const raw = await getJson("/people.json");
    const list = (raw as { people?: unknown }).people;
    if (!Array.isArray(list)) return bundledPeople;
    const people = list.filter(isPerson);
    return people.length ? people : bundledPeople;
  } catch {
    if (!bundledPeople.length) throw new Error("NO RECRUITS");
    return bundledPeople;
  }
}

export async function loadWorkout(path: string): Promise<Workout> {
  try {
    const raw = await getJson(path);
    if (!isWorkout(raw)) throw new Error(`BAD ORDERS: ${path}`);
    return raw;
  } catch (err) {
    if (path.endsWith("/pat.json")) {
      const fallback = await getJson("/workouts/me.json");
      if (isWorkout(fallback)) return fallback;
    }
    throw err;
  }
}
