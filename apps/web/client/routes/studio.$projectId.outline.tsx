import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import OutlineBuilder from "../components/panels/OutlineBuilder";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { useStudioLayout } from "../components/studio/studio-layout-context";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/$projectId/outline")({
  component: StudioOutline,
});

function StudioOutline() {
  const { projectId } = Route.useParams();
  const { drawerOpen } = useStudioLayout();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  const title = project.data?.title ?? "Untitled book";

  return (
    <>
      <BreadcrumbPill title={title} subtitle="Outline" />
      <main
        className={`px-6 pt-28 pb-40 transition-[padding] ${drawerOpen ? "lg:pl-[19rem]" : ""}`}
      >
        <div className="mx-auto w-full max-w-5xl">
          {project.isLoading || !project.data ? (
            <p className="px-6 py-12 text-neutral-500">Loading…</p>
          ) : (
            <OutlineBuilder project={project.data} view="outline" />
          )}
        </div>
      </main>
    </>
  );
}
