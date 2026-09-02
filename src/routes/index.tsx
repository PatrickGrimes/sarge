import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { bundledPeople } from "@/lib/data";
import { resolveWho } from "@/lib/who";

type WhoSearch = {
  who?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): WhoSearch => ({
    who: typeof search.who === "string" ? search.who : undefined,
  }),
  component: Home,
});

function Home() {
  const { who } = Route.useSearch();
  const navigate = useNavigate();
  const id = resolveWho(who, bundledPeople);

  useEffect(() => {
    if (!id) return;
    void navigate({ to: "/$who", params: { who: id }, replace: true });
  }, [id, navigate]);

  return <AppShell who={null} />;
}
