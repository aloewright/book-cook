import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import OutlineBuilderQA from "../components/panels/OutlineBuilderQA";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { api, queryKeys } from "../lib/api";
import { useDrawerLayout } from "../lib/drawer-layout";

export const Route = createFileRoute("/studio/$projectId/outline")({
  component: StudioOutline,
});

function StudioOutline() {
  const { projectId } = Route.useParams();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const drawer = useDrawerLayout();

  const title = project.data?.title ?? "Untitled book";

  return (
    <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <SideDrawer projectId={projectId} current="outline" />
      <TopLeftPill />
      <BreadcrumbPill title={title} />

      <main
        className={`pt-24 transition-[padding] ${
          drawer.open ? (drawer.collapsed ? "lg:pl-[5rem]" : "lg:pl-[19rem]") : ""
        }`}
      >
        {project.isLoading || !project.data ? (
          <p className="px-6 py-12 text-neutral-500">Loading…</p>
        ) : (
          <OutlineBuilderQA project={project.data} />
        )}
      </main>
    </div>
  );
}
