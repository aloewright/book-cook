import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import LaunchPanel from "../components/panels/LaunchPanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/projects/$projectId/launch")({ component: LaunchPage });

function LaunchPage() {
  const { projectId } = Route.useParams();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const brief = useQuery({
    queryKey: queryKeys.gtmBrief(projectId),
    queryFn: () => api.getGtmBrief(projectId),
  });

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-3">
            <Link to="/projects/$projectId" params={{ projectId }}>
              Back to workspace
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">Launch</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate the launch handoff after publisher metadata is approved.
          </p>
        </div>
        <Badge variant={brief.data?.brief ? "default" : "secondary"}>
          {brief.data?.brief ? "Brief ready" : (project.data?.title ?? "Launch")}
        </Badge>
      </div>

      <LaunchPanel projectId={projectId} />
    </section>
  );
}
