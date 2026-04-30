import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, Trash2 } from "lucide-react";
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
    </section>
  );
}
