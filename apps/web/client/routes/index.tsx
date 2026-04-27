import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Write your book with Aloysius.</h1>
      <p className="mt-6 text-lg text-slate-600">
        Market research, voice, outline, drafts, KDP package, and an audiobook — in one place.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link to="/sign-up" className="rounded-md bg-slate-900 px-6 py-3 text-white">Start writing</Link>
        <Link to="/sign-in" className="rounded-md border px-6 py-3">Sign in</Link>
      </div>
    </section>
  ),
});
