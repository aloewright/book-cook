import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, queryKeys, type Project } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: queryKeys.projects(), queryFn: api.listProjects });
  const create = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects() }),
  });
  const del = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects() }),
  });

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"nonfiction" | "fiction">("nonfiction");

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Your books</h1>

      <form
        className="mb-10 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate({ title: title.trim(), type });
          setTitle("");
        }}
      >
        <Input placeholder="Working title…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value as "nonfiction" | "fiction")} className="rounded-md border px-2">
          <option value="nonfiction">Nonfiction</option>
          <option value="fiction">Fiction</option>
        </select>
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "…" : "New book"}</Button>
      </form>

      <ul className="grid gap-3">
        {(projects.data?.items ?? []).map((p: Project) => (
          <li key={p.id} className="flex items-center justify-between rounded-md border bg-white p-4">
            <Link to="/projects/$projectId" params={{ projectId: p.id }} className="font-medium">
              {p.title}
            </Link>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>{p.type}</span>
              <span>{p.status}</span>
              <button onClick={() => del.mutate(p.id)} className="text-red-600">Delete</button>
            </div>
          </li>
        ))}
        {projects.data && projects.data.items.length === 0 ? (
          <li className="rounded-md border border-dashed bg-white p-8 text-center text-slate-500">
            No books yet. Start one above.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
