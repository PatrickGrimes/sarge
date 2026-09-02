import { create } from "zustand";
import { loadPeople, loadWorkout, bundledPeople } from "@/lib/data";
import { hush, line, speakFromFile, warmVoices } from "@/lib/speech";
import { inkFor, type Person, type Workout } from "@/lib/types";
import { resolveWho } from "@/lib/who";

const PERSON_KEY = "sarnt-person-id";
const MUTE_KEY = "sarnt-mute";

export type Screen = "boot" | "who" | "briefing" | "splash" | "work" | "rest" | "done";

type SarntState = {
  screen: Screen;
  people: Person[];
  person: Person | null;
  workout: Workout | null;
  error: string | null;
  exerciseIndex: number;
  setIndex: number;
  restLeft: number;
  muted: boolean;
  paused: boolean;
  boot: (who?: string | null) => Promise<void>;
  choose: (id: string) => Promise<void>;
  clearPerson: () => void;
  begin: () => void;
  completeSet: () => void;
  skipRest: () => void;
  tickRest: () => void;
  pauseToggle: () => void;
  toggleMute: () => void;
};

let splashTimer = 0;
let speakTimer = 0;

function clearTimers() {
  if (splashTimer) window.clearTimeout(splashTimer);
  if (speakTimer) window.clearTimeout(speakTimer);
  splashTimer = 0;
  speakTimer = 0;
}

function paintAccent(person: Person | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!person) {
    root.style.removeProperty("--color-accent");
    root.style.removeProperty("--color-accent-ink");
    root.dataset.person = "";
    return;
  }
  root.style.setProperty("--color-accent", person.accent);
  root.style.setProperty("--color-accent-ink", inkFor(person.accent));
  root.dataset.person = person.id;
}

function bark(
  muted: boolean,
  workout: Workout | null,
  text: string | undefined,
) {
  if (muted || !workout || !text) return;
  void speakFromFile(text, workout.voice);
}

function endRest() {
  const { workout, muted, exerciseIndex, setIndex } = useSarnt.getState();
  useSarnt.setState({ screen: "work", restLeft: 0, paused: false });
  if (!workout) return;
  const exercise = workout.exercises[exerciseIndex];
  if (!exercise) return;
  if (setIndex === 0) {
    bark(muted, workout, line(workout.voice, "nextExercise"));
    speakTimer = window.setTimeout(() => {
      const w = useSarnt.getState().workout;
      const i = useSarnt.getState().exerciseIndex;
      if (!w) return;
      bark(useSarnt.getState().muted, w, w.exercises[i]?.speakStart);
    }, 800);
    return;
  }
  const last = setIndex + 1 >= exercise.sets;
  bark(muted, workout, line(workout.voice, last ? "lastSet" : "nextSet"));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const useSarnt = create<SarntState>((set, get) => ({
  screen: "who",
  people: bundledPeople,
  person: null,
  workout: null,
  error: null,
  exerciseIndex: 0,
  setIndex: 0,
  restLeft: 0,
  muted: false,
  paused: false,

  boot: async (who) => {
    warmVoices();
    clearTimers();
    hush();
    const muted =
      typeof localStorage !== "undefined" &&
      localStorage.getItem(MUTE_KEY) === "1";
    let people = bundledPeople;
    try {
      people = await loadPeople();
    } catch {
      people = bundledPeople;
    }
    const wanted = resolveWho(who, people);
    set({ people, muted, error: null });
    if (wanted) {
      await get().choose(wanted);
      return;
    }
    paintAccent(null);
    set({
      person: null,
      workout: null,
      screen: "who",
      exerciseIndex: 0,
      setIndex: 0,
      restLeft: 0,
      paused: false,
    });
  },

  choose: async (id) => {
    const person = get().people.find((p) => p.id === id);
    if (!person) return;
    paintAccent(person);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PERSON_KEY, id);
    }
    set({
      person,
      error: null,
      screen: "boot",
      workout: null,
      exerciseIndex: 0,
      setIndex: 0,
      restLeft: 0,
      paused: false,
    });
    try {
      const workout = await loadWorkout(person.workout);
      set({ workout, screen: "briefing" });
      bark(get().muted, workout, line(workout.voice, "welcome"));
    } catch (err) {
      set({
        workout: null,
        error: err instanceof Error ? err.message : "NO ORDERS",
        screen: "briefing",
      });
    }
  },

  clearPerson: () => {
    hush();
    clearTimers();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(PERSON_KEY);
    }
    paintAccent(null);
    set({
      person: null,
      workout: null,
      screen: "who",
      error: null,
      exerciseIndex: 0,
      setIndex: 0,
      restLeft: 0,
      paused: false,
    });
  },

  begin: () => {
    const { workout, muted } = get();
    if (!workout?.exercises.length) return;
    clearTimers();
    const startWork = () => {
      if (!get().workout) return;
      set({
        screen: "work",
        exerciseIndex: 0,
        setIndex: 0,
        restLeft: 0,
        paused: false,
      });
      speakTimer = window.setTimeout(() => {
        const w = get().workout;
        if (!w) return;
        bark(get().muted, w, w.exercises[0]?.speakStart);
      }, 400);
    };
    bark(muted, workout, line(workout.voice, "start"));
    if (prefersReducedMotion()) {
      startWork();
      return;
    }
    set({
      screen: "splash",
      exerciseIndex: 0,
      setIndex: 0,
      restLeft: 0,
      paused: false,
    });
    splashTimer = window.setTimeout(startWork, 1600);
  },

  completeSet: () => {
    const { workout, exerciseIndex, setIndex, muted } = get();
    if (!workout) return;
    const exercise = workout.exercises[exerciseIndex];
    if (!exercise) return;
    const lastSet = setIndex + 1 >= exercise.sets;
    const lastMove = exerciseIndex + 1 >= workout.exercises.length;
    clearTimers();

    if (lastSet && lastMove) {
      hush();
      bark(muted, workout, exercise.speakDone);
      speakTimer = window.setTimeout(() => {
        const w = get().workout;
        if (!w) return;
        bark(get().muted, w, line(w.voice, "complete"));
      }, 1100);
      set({ screen: "done", paused: false });
      return;
    }

    if (lastSet) {
      bark(muted, workout, exercise.speakDone ?? line(workout.voice, "setDone"));
      set({
        screen: "rest",
        restLeft: exercise.restSec,
        exerciseIndex: exerciseIndex + 1,
        setIndex: 0,
        paused: false,
      });
      speakTimer = window.setTimeout(() => {
        const w = get().workout;
        if (!w) return;
        bark(get().muted, w, line(w.voice, "rest"));
      }, 800);
      return;
    }

    bark(muted, workout, line(workout.voice, "setDone"));
    set({
      screen: "rest",
      restLeft: exercise.restSec,
      setIndex: setIndex + 1,
      paused: false,
    });
    speakTimer = window.setTimeout(() => {
      const w = get().workout;
      const i = get().exerciseIndex;
      if (!w) return;
      bark(get().muted, w, w.exercises[i]?.speakRest ?? line(w.voice, "rest"));
    }, 700);
  },

  skipRest: () => {
    if (get().screen !== "rest") return;
    clearTimers();
    endRest();
  },

  tickRest: () => {
    const { screen, restLeft, paused } = get();
    if (screen !== "rest" || paused) return;
    const next = restLeft - 1;
    if (next <= 0) {
      endRest();
      return;
    }
    set({ restLeft: next });
  },

  pauseToggle: () => {
    const { paused, workout, muted, screen } = get();
    if (screen !== "work" && screen !== "rest") return;
    const next = !paused;
    set({ paused: next });
    if (!workout) return;
    if (next) {
      hush();
      bark(muted, workout, line(workout.voice, "pause"));
    } else {
      bark(muted, workout, line(workout.voice, "resume"));
    }
  },

  toggleMute: () => {
    const muted = !get().muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    }
    if (muted) hush();
    set({ muted });
  },
}));
