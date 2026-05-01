import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { type Project, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: queryKeys.projects(), queryFn: api.listProjects });
  const deletedProjects = useQuery({
    queryKey: queryKeys.deletedProjects(),
    queryFn: api.listDeletedProjects,
  });
  const create = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects() }),
  });
  const del = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.projects() }),
        qc.invalidateQueries({ queryKey: queryKeys.deletedProjects() }),
      ]),
  });
  const restore = useMutation({
    mutationFn: api.restoreProject,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.projects() }),
        qc.invalidateQueries({ queryKey: queryKeys.deletedProjects() }),
      ]),
  });

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"nonfiction" | "fiction">("nonfiction");

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Your books</h1>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate({ title: title.trim(), type });
          setTitle("");
        }}
      >
        <Input
          className="flex-1"
          placeholder="Working title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select value={type} onValueChange={(v) => setType(v as "nonfiction" | "fiction")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nonfiction">Nonfiction</SelectItem>
            <SelectItem value="fiction">Fiction</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={create.isPending || !title.trim()}>
          {create.isPending ? "Creating…" : "New book"}
        </Button>
      </form>

      {create.isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(create.error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3">
        {(projects.data?.items ?? []).map((p: Project) => (
          <Card
            key={p.id}
            className="relative flex items-center justify-between p-4 shadow-none transition-colors hover:bg-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
          >
            <Link
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              aria-label={`Open ${p.title}`}
              className="absolute inset-0 z-0 rounded-xl focus:outline-none"
            />
            <div className="pointer-events-none relative z-10 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{p.title}</span>
            </div>
            <div className="relative z-10 flex items-center gap-2">
              <Badge variant="secondary" className="pointer-events-none">
                {p.type}
              </Badge>
              <Badge className="pointer-events-none">{p.status}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  del.mutate(p.id);
                }}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}

        {projects.data && projects.data.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-muted-foreground shadow-none">
            No books yet. Start one above.
          </Card>
        ) : null}
      </div>

      {(deletedProjects.data?.items.length ?? 0) > 0 ? (
        <section className="mt-10 border-t pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recently deleted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Deleted books can be restored for {deletedProjects.data?.retention_days ?? 30} days.
              </p>
            </div>
            <Badge variant="secondary">{deletedProjects.data?.items.length} recoverable</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {deletedProjects.data?.items.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-4 shadow-none">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {daysRemaining(p.deleted_at).toLocaleString()} days left to restore
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={restore.isPending && restore.variables === p.id}
                  onClick={() => restore.mutate(p.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  {restore.isPending && restore.variables === p.id ? "Restoring..." : "Restore"}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function daysRemaining(value: Project["deleted_at"]) {
  const deletedAt = value ? new Date(value).getTime() : Date.now();
  if (Number.isNaN(deletedAt)) return 30;
  const expiresAt = deletedAt + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}
