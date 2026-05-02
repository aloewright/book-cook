import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const nav = useNavigate();
  const session = useQuery({
    queryKey: queryKeys.me(),
    queryFn: api.maybeMe,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (session.data?.user) void nav({ to: "/dashboard", replace: true });
  }, [nav, session.data?.user]);

  if (session.data?.user) {
    return <p className="px-6 py-12 text-muted-foreground">Opening your dashboard...</p>;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Write your book with Aloysius.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Market research, voice, outline, drafts, KDP package, and an audiobook — in one place.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Button size="lg" onClick={() => nav({ to: "/sign-up" })}>
          Start writing
        </Button>
        <Button size="lg" variant="outline" onClick={() => nav({ to: "/sign-in" })}>
          Sign in
        </Button>
      </div>
    </section>
  );
}
