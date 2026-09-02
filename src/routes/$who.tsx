import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { bundledPeople } from "@/lib/data";
import { resolveWho } from "@/lib/who";

export const Route = createFileRoute("/$who")({
  component: PersonHome,
});

function PersonHome() {
  const { who } = Route.useParams();
  const navigate = useNavigate();
  const id = resolveWho(who, bundledPeople);

  useEffect(() => {
    if (!id) {
      void navigate({ to: "/", replace: true });
      return;
    }
    if (who !== id) {
      void navigate({ to: "/$who", params: { who: id }, replace: true });
    }
  }, [id, navigate, who]);

  return <AppShell who={id} />;
}
