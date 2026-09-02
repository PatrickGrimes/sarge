import { useEffect } from "react";
import { Briefing } from "@/components/briefing";
import { Chrome } from "@/components/chrome";
import { Done } from "@/components/done";
import { Session } from "@/components/session";
import { Splash } from "@/components/splash";
import { Who } from "@/components/who";
import { useSarnt } from "@/lib/store";

type Props = {
  who?: string | null;
};

export function AppShell({ who }: Props) {
  const screen = useSarnt((s) => s.screen);
  const boot = useSarnt((s) => s.boot);

  useEffect(() => {
    void boot(who);
  }, [boot, who]);

  const waitingOnRecruit = Boolean(who) && (screen === "who" || screen === "boot");
  const shown = waitingOnRecruit ? "boot" : screen;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col bg-asphalt">
      {shown === "splash" ? null : <Chrome />}
      {shown === "boot" ? <BootMark /> : null}
      {shown === "who" ? <Who /> : null}
      {shown === "briefing" ? <Briefing /> : null}
      {shown === "work" || shown === "rest" ? <Session /> : null}
      {shown === "done" ? <Done /> : null}
      {shown === "splash" ? <Splash /> : null}
    </main>
  );
}

function BootMark() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6">
      <p className="font-display text-7xl text-accent">SARN'T</p>
      <p className="mt-2 font-body text-sm font-semibold tracking-[0.4em] text-dust">
        LOADING ORDERS
      </p>
    </section>
  );
}
