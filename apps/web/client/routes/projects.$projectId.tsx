import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "../lib/api";
import { TopBar } from "../components/workspace/top-bar";
import { OutlineRail } from "../components/workspace/outline-rail";
import { AloysiusSidecar } from "../components/chat/aloysius-sidecar";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectWorkspace });

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  if (project.isLoading || !project.data) {
    return <p className="px-6 py-12 text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      <TopBar project={project.data} />
      <div className="grid flex-1 grid-cols-[200px_1fr_320px]">
        <OutlineRail active="concept" />
        <main className="px-6 py-12">
          <p className="text-sm text-slate-500">
            Concept mode — content lands in Phase 2 (Book Architect).
          </p>
        </main>
        <AloysiusSidecar projectId={projectId} />
      </div>
    </div>
  );
}
