import { Duotone } from "@/components/duotone";
import { useSarnt } from "@/lib/store";

export function Briefing() {
  const workout = useSarnt((s) => s.workout);
  const error = useSarnt((s) => s.error);
  const person = useSarnt((s) => s.person);
  const begin = useSarnt((s) => s.begin);

  if (error || !workout) {
    return (
      <section className="flex flex-1 flex-col items-start px-4 pb-8">
        <p className="font-display text-5xl leading-none text-accent">NO ORDERS</p>
        <p className="mt-3 max-w-md font-body text-lg font-semibold text-dust">
          Morning file missing for {person?.name ?? "this recruit"}. The bot has
          not dropped today's workout yet.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-4 overflow-hidden ring-1 ring-line">
        <Duotone
          src={person?.splash || person?.portrait || "/images/sarnt.jpg"}
          baked={Boolean(person?.splash)}
          position={person?.focus}
          className="h-72 w-full sm:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-body text-xs font-semibold tracking-[0.35em] text-accent">
            SARN'T {person?.sarnt} · {person?.name} · {workout.date}
          </p>
          <h1 className="font-display text-6xl leading-none text-paper sm:text-7xl">
            {workout.title}
          </h1>
        </div>
      </div>

      <p className="mt-4 px-4 font-display text-2xl leading-none tracking-wide text-accent">
        {workout.subtitle}
      </p>
      <p className="mt-2 px-4 font-body text-sm font-semibold tracking-[0.25em] text-dust">
        {workout.durationMin} MIN · {workout.exercises.length} MOVES
      </p>

      <ol className="mt-5 flex-1 space-y-0 px-4">
        {workout.exercises.map((ex, i) => (
          <li
            key={ex.id}
            className="flex items-center gap-3 border-t border-line py-3"
          >
            <span className="w-8 font-display text-2xl leading-none text-accent tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <img
              src={ex.image}
              alt=""
              className="size-14 shrink-0 object-cover ring-1 ring-line"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-2xl leading-none text-paper">
                {ex.name}
              </p>
              <p className="mt-1 font-body text-sm font-semibold tracking-wide text-dust">
                {ex.sets} × {ex.reps}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-0 mt-2 bg-asphalt/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={begin}
          className="flex min-h-14 w-full items-center justify-center bg-accent font-display text-3xl tracking-wide text-accent-ink transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          BEGIN
        </button>
      </div>
    </section>
  );
}
