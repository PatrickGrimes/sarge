import { Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSarnt } from "@/lib/store";

export function Chrome() {
  const person = useSarnt((s) => s.person);
  const muted = useSarnt((s) => s.muted);
  const screen = useSarnt((s) => s.screen);
  const toggleMute = useSarnt((s) => s.toggleMute);
  const clearPerson = useSarnt((s) => s.clearPerson);
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
      <div className="min-w-0">
        <p className="font-display text-3xl leading-none tracking-wide text-accent">
          {person?.sarnt ? `SARN'T ${person.sarnt}` : "SARN'T"}
        </p>
        {person ? (
          <p className="font-body text-sm font-semibold tracking-[0.28em] text-dust">
            {person.name}
          </p>
        ) : (
          <p className="font-body text-sm font-semibold tracking-[0.28em] text-dust">
            REPORT
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {person && screen !== "who" ? (
          <button
            type="button"
            onClick={() => {
              clearPerson();
              void navigate({ to: "/" });
            }}
            className="min-h-11 px-3 font-display text-lg tracking-wide text-dust ring-1 ring-line transition-colors duration-150 hover:text-paper"
          >
            SWITCH
          </button>
        ) : null}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute SARN'T" : "Mute SARN'T"}
          className="grid size-11 place-items-center text-accent ring-1 ring-line"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>
    </header>
  );
}
