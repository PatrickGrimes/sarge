export type Person = {
  id: string;
  name: string;
  sarnt: string;
  accent: string;
  portrait: string;
  splash: string;
  focus?: string;
  workout: string;
};

export type VoiceConfig = {
  lang: string;
  preferredNames: string[];
  pitch: number;
  rate: number;
  volume: number;
  script: Record<string, string>;
};

export type Exercise = {
  id: string;
  name: string;
  image: string;
  sets: number;
  reps: string;
  restSec: number;
  cue: string;
  speakStart?: string;
  speakRest?: string;
  speakDone?: string;
};

export type Workout = {
  date: string;
  title: string;
  subtitle: string;
  durationMin: number;
  voice: VoiceConfig;
  exercises: Exercise[];
};

export function inkFor(hex: string): string {
  const n = hex.replace("#", "").trim();
  if (n.length < 6) return "#0A0A0A";
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.55 ? "#0A0A0A" : "#F4F1EA";
}

export function isPerson(v: unknown): v is Person {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.sarnt === "string" &&
    typeof p.accent === "string" &&
    typeof p.portrait === "string" &&
    typeof p.splash === "string" &&
    typeof p.workout === "string"
  );
}

export function isWorkout(v: unknown): v is Workout {
  if (!v || typeof v !== "object") return false;
  const w = v as Record<string, unknown>;
  if (
    typeof w.date !== "string" ||
    typeof w.title !== "string" ||
    typeof w.subtitle !== "string" ||
    typeof w.durationMin !== "number" ||
    !w.voice ||
    typeof w.voice !== "object" ||
    !Array.isArray(w.exercises)
  ) {
    return false;
  }
  const voice = w.voice as Record<string, unknown>;
  if (
    typeof voice.lang !== "string" ||
    !Array.isArray(voice.preferredNames) ||
    typeof voice.pitch !== "number" ||
    typeof voice.rate !== "number" ||
    typeof voice.volume !== "number" ||
    !voice.script ||
    typeof voice.script !== "object"
  ) {
    return false;
  }
  return w.exercises.every((ex) => {
    if (!ex || typeof ex !== "object") return false;
    const e = ex as Record<string, unknown>;
    return (
      typeof e.id === "string" &&
      typeof e.name === "string" &&
      typeof e.image === "string" &&
      typeof e.sets === "number" &&
      typeof e.reps === "string" &&
      typeof e.restSec === "number" &&
      typeof e.cue === "string"
    );
  });
}
