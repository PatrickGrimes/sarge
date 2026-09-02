import { useNavigate } from "@tanstack/react-router";
import { Duotone } from "@/components/duotone";
import { useSarnt } from "@/lib/store";

export function Who() {
  const people = useSarnt((s) => s.people);
  const error = useSarnt((s) => s.error);
  const navigate = useNavigate();

  return (
    <section className="flex flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p className="font-display text-5xl leading-none text-paper sm:text-6xl">
        WHO IS
        <br />
        WORKING
      </p>
      <p className="mt-3 max-w-md font-body text-lg font-semibold tracking-wide text-dust">
        Bookmark PAT or PAM. Next time you skip this screen.
      </p>
      {error ? (
        <p className="mt-4 font-body text-base font-semibold text-accent">{error}</p>
      ) : null}
      <div className="mt-6 grid flex-1 gap-4 sm:grid-cols-2">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              void navigate({ to: "/$who", params: { who: p.id } })
            }
            aria-label={`Train as ${p.name}`}
            className="group relative min-h-[280px] overflow-hidden text-left ring-1 ring-line transition-transform duration-200 ease-out active:scale-[0.96]"
          >
            <Duotone
              src={p.splash || p.portrait}
              baked={Boolean(p.splash)}
              position={p.focus}
              className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/30 to-transparent" />
            <span
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: p.accent }}
            />
            <span className="absolute inset-x-0 bottom-0 p-5">
              <span
                className="font-display text-6xl leading-none tracking-wide"
                style={{ color: p.accent }}
              >
                {p.name}
              </span>
              <span className="mt-1 block font-body text-sm font-semibold tracking-[0.32em] text-paper">
                SARN'T {p.sarnt} · /{p.id}
              </span>
            </span>
          </button>
        ))}
      </div>
      <a
        href="/sarnt-workout.zip"
        download="sarnt-workout.zip"
        className="mt-6 flex min-h-12 items-center justify-center font-body text-sm font-semibold tracking-[0.32em] text-dust ring-1 ring-line transition-colors duration-150 hover:text-paper"
      >
        DOWNLOAD SOURCE
      </a>
    </section>
  );
}
