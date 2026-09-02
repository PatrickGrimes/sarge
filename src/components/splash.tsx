import { Duotone } from "@/components/duotone";
import { useSarnt } from "@/lib/store";

export function Splash() {
  const person = useSarnt((s) => s.person);
  const workout = useSarnt((s) => s.workout);
  if (!person) return null;

  return (
    <section className="splash-in fixed inset-0 z-30 bg-asphalt">
      <Duotone
        src={person.splash}
        baked
        position={person.focus}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/25 to-asphalt/35" />
      <div className="absolute inset-x-0 top-0 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="font-display text-3xl leading-none tracking-wide text-accent">
          SARN'T {person.sarnt}
        </p>
        <p className="mt-1 font-body text-sm font-semibold tracking-[0.32em] text-dust">
          {person.name}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="font-body text-xs font-semibold tracking-[0.4em] text-accent">
          {workout?.date}
        </p>
        <h1 className="font-display text-7xl leading-none text-paper sm:text-8xl">
          {workout?.title ?? "MOVE"}
        </h1>
        <p className="mt-2 font-display text-3xl tracking-wide text-accent">
          MOVE
        </p>
      </div>
    </section>
  );
}
