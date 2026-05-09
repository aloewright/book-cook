import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Sparkles } from "lucide-react";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/")({ component: StudioHome });

function StudioHome() {
  const nav = useNavigate();
  const projects = useQuery({ queryKey: queryKeys.projects(), queryFn: api.listProjects });
  const items = projects.data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#efece2] px-6 py-12 text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <Sparkles className="size-4" />
              <span>Studio</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl tracking-tight">Your books</h1>
          </div>
          <button
            className="flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 font-medium text-sm text-white shadow hover:bg-neutral-800"
            onClick={() => nav({ to: "/studio/compose" })}
            type="button"
          >
            <Plus className="size-4" />
            New book
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            className="group flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-300 border-dashed bg-white/40 text-neutral-500 transition hover:border-neutral-500 hover:text-neutral-900 dark:border-white/15 dark:bg-white/5 dark:hover:text-white"
            onClick={() => nav({ to: "/studio/compose" })}
            type="button"
          >
            <Plus className="size-6" />
            <span className="font-medium text-sm">Start with a logline</span>
          </button>

          {items.map((p) => (
            <Link
              className="group relative flex h-44 flex-col justify-between rounded-2xl bg-white/80 p-5 ring-1 ring-black/5 transition hover:shadow-lg dark:bg-neutral-900/80 dark:ring-white/5"
              key={p.id}
              params={{ projectId: p.id }}
              to="/studio/$projectId"
            >
              <div className="flex items-center gap-2 text-neutral-500 text-xs">
                <BookOpen className="size-3.5" />
                <span className="capitalize">{p.type}</span>
              </div>
              <div>
                <div className="font-serif text-xl tracking-tight">{p.title}</div>
                <div className="mt-1 text-neutral-500 text-xs">
                  {new Date(p.created_at ?? Date.now()).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
