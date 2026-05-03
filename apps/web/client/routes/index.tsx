import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";

type SessionResponse = { user?: { id: string } | null };

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await fetch("/api/v1/session", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? (res.json() as Promise<SessionResponse>) : null))
      .catch(() => null);

    if (session?.user) {
      throw redirect({ to: "/dashboard", replace: true });
    }
  },
  component: Landing,
});

function Landing() {
  const nav = useNavigate();

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
