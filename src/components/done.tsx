import { useNavigate } from "@tanstack/react-router";
import { Duotone } from "@/components/duotone";
import { useSarnt } from "@/lib/store";

export function Done() {
  const person = useSarnt((s) => s.person);
  const workout = useSarnt((s) => s.workout);
  const begin = useSarnt((s) => s.begin);
  const clearPerson = useSarnt((s) => s.clearPerson);
  const navigate = useNavigate();

  return (
    <section className="flex flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="relative overflow-hidden ring-1 ring-line">
        <Duotone
          src={person?.splash || "/images/sarnt.jpg"}
          baked={Boolean(person?.splash)}
          position={person?.focus}
          className="h-64 w-full sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-asphalt to-transparent" />
      </div>
      <p className="mt-6 font-body text-xs font-semibold tracking-[0.4em] text-accent">
        SARN'T {person?.sarnt} · {person?.name} · {workout?.date}
      </p>
      <h1 className="mt-2 font-display text-7xl leading-none text-paper">
        DISMISSED
      </h1>
      <p className="mt-3 max-w-md font-display text-2xl leading-snug tracking-wide text-accent">
        {workout?.voice.script.complete}
      </p>
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <button
          type="button"
          onClick={begin}
          className="flex min-h-14 items-center justify-center bg-accent font-display text-3xl tracking-wide text-accent-ink transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          RUN IT AGAIN
        </button>
        <button
          type="button"
          onClick={() => {
            clearPerson();
            void navigate({ to: "/" });
          }}
          className="flex min-h-12 items-center justify-center font-display text-2xl tracking-wide text-dust ring-1 ring-line"
        >
          SWITCH RECRUIT
        </button>
      </div>
    </section>
  );
}
