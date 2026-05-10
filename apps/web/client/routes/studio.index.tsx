import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { type Project, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/")({ component: StudioHome });

function StudioHome() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: queryKeys.projects(), queryFn: api.listProjects });
  const deletedProjects = useQuery({
    queryKey: queryKeys.deletedProjects(),
    queryFn: api.listDeletedProjects,
  });
  const items = projects.data?.items ?? [];
  const deletedItems = deletedProjects.data?.items ?? [];
  const retentionDays = deletedProjects.data?.retention_days ?? 30;

  const deleteProject = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.projects() }),
        qc.invalidateQueries({ queryKey: queryKeys.deletedProjects() }),
      ]),
  });

  const restoreProject = useMutation({
    mutationFn: api.restoreProject,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.projects() }),
        qc.invalidateQueries({ queryKey: queryKeys.deletedProjects() }),
      ]),
  });

  function handleDelete(id: string) {
    if (typeof window === "undefined") return;
    if (!window.confirm("Delete this book? You can restore it within 30 days.")) return;
    deleteProject.mutate(id);
  }

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
            <div className="group relative h-44" key={p.id}>
              <Link
                className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-white/80 p-5 ring-1 ring-black/5 transition hover:shadow-lg dark:bg-neutral-900/80 dark:ring-white/5"
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
              <button
                aria-label={`Delete ${p.title}`}
                className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full text-neutral-400 opacity-0 transition hover:bg-black/5 hover:text-neutral-900 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-white"
                disabled={deleteProject.isPending && deleteProject.variables === p.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(p.id);
                }}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {deletedItems.length > 0 ? (
          <details className="mt-10 rounded-2xl bg-white/60 p-5 ring-1 ring-black/5 dark:bg-neutral-900/60 dark:ring-white/5">
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg tracking-tight">Recently deleted</h2>
                <p className="mt-0.5 text-neutral-500 text-xs">
                  Auto-deleted after {retentionDays} days.
                </p>
              </div>
              <span className="rounded-full bg-neutral-200/60 px-2.5 py-1 text-neutral-700 text-xs dark:bg-white/10 dark:text-neutral-200">
                {deletedItems.length} recoverable
              </span>
            </summary>
            <ul className="mt-4 grid gap-2">
              {deletedItems.map((p) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3 ring-1 ring-black/5 dark:bg-neutral-900/80 dark:ring-white/5"
                  key={p.id}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-neutral-500" />
                    <div>
                      <div className="font-medium text-sm">{p.title}</div>
                      <div className="text-neutral-500 text-xs">
                        {daysRemaining(p.deleted_at, retentionDays)} days left to restore
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-1.5 font-medium text-white text-xs hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                    disabled={restoreProject.isPending && restoreProject.variables === p.id}
                    onClick={() => restoreProject.mutate(p.id)}
                    type="button"
                  >
                    <RotateCcw className="size-3.5" />
                    {restoreProject.isPending && restoreProject.variables === p.id
                      ? "Restoring…"
                      : "Restore"}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function daysRemaining(value: Project["deleted_at"], retentionDays: number) {
  const deletedAt = value ? new Date(value).getTime() : Date.now();
  if (Number.isNaN(deletedAt)) return retentionDays;
  const expiresAt = deletedAt + retentionDays * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}
