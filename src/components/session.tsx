import { useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { useSarnt } from "@/lib/store";

export function Session() {
  const workout = useSarnt((s) => s.workout);
  const screen = useSarnt((s) => s.screen);
  const exerciseIndex = useSarnt((s) => s.exerciseIndex);
  const setIndex = useSarnt((s) => s.setIndex);
  const restLeft = useSarnt((s) => s.restLeft);
  const paused = useSarnt((s) => s.paused);
  const completeSet = useSarnt((s) => s.completeSet);
  const skipRest = useSarnt((s) => s.skipRest);
  const tickRest = useSarnt((s) => s.tickRest);
  const pauseToggle = useSarnt((s) => s.pauseToggle);

  useEffect(() => {
    if (screen !== "rest") return;
    const id = window.setInterval(() => tickRest(), 1000);
    return () => window.clearInterval(id);
  }, [screen, tickRest]);

  if (!workout) return null;
  const exercise = workout.exercises[exerciseIndex];
  if (!exercise) return null;

  const resting = screen === "rest";
  const moveLabel = `${exerciseIndex + 1} / ${workout.exercises.length}`;

  return (
    <section className="flex flex-1 flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-4 overflow-hidden ring-1 ring-line">
        <img
          src={exercise.image}
          alt=""
          className="h-64 w-full object-cover sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-transparent to-asphalt/30" />
        <div className="absolute left-3 top-3 bg-asphalt/80 px-2 py-1 font-body text-xs font-semibold tracking-[0.28em] text-accent">
          MOVE {moveLabel}
        </div>
        {paused ? (
          <div className="absolute inset-0 grid place-items-center bg-asphalt/55">
            <p className="font-display text-5xl text-accent">HOLD</p>
          </div>
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <h1 className="font-display text-5xl leading-none text-paper sm:text-6xl">
          {exercise.name}
        </h1>
        <p className="mt-2 font-display text-xl leading-snug tracking-wide text-accent">
          {exercise.cue}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 px-4">
        <Stat label="SET" value={`${setIndex + 1}/${exercise.sets}`} />
        <Stat label="WORK" value={exercise.reps} />
        <Stat
          label={resting ? "REST" : "NEXT REST"}
          value={resting ? `${restLeft}s` : `${exercise.restSec}s`}
        />
      </div>

      {resting ? (
        <div className="mt-8 flex flex-col items-center px-4">
          <p className="font-body text-sm font-semibold tracking-[0.4em] text-dust">
            REST
          </p>
          <p className="font-display text-[7.5rem] leading-none text-accent tabular-nums">
            {restLeft}
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex gap-2 px-4 pt-6">
        <button
          type="button"
          onClick={pauseToggle}
          aria-label={paused ? "Resume" : "Pause"}
          className="grid min-h-14 min-w-14 place-items-center ring-1 ring-line text-paper"
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
        {resting ? (
          <button
            type="button"
            onClick={skipRest}
            className="flex min-h-14 flex-1 items-center justify-center bg-accent font-display text-3xl tracking-wide text-accent-ink"
          >
            SKIP REST
          </button>
        ) : (
          <button
            type="button"
            onClick={completeSet}
            className="flex min-h-14 flex-1 items-center justify-center bg-accent font-display text-3xl tracking-wide text-accent-ink"
          >
            SET DONE
          </button>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-tar px-3 py-3 ring-1 ring-line">
      <p className="font-body text-[0.7rem] font-semibold tracking-[0.28em] text-dust">
        {label}
      </p>
      <p className="mt-1 truncate font-display text-3xl leading-none text-paper tabular-nums">
        {value}
      </p>
    </div>
  );
}
