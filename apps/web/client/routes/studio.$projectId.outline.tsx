import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import OutlineBuilder from "../components/panels/OutlineBuilder";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { TopRightPill } from "../components/studio/TopRightPill";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/$projectId/outline")({
  component: StudioOutline,
});

function StudioOutline() {
  const { projectId } = Route.useParams();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const [drawerOpen, setDrawerOpen] = useState(true);

  const title = project.data?.title ?? "Untitled book";

  return (
    <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={projectId}
        current="outline"
      />
      <TopLeftPill drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
      <BreadcrumbPill title={title} subtitle="Outline" />
      <TopRightPill />

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
    </div>
  );
}
