import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import FullBookPanel from "../components/panels/FullBookPanel";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { TopRightPill } from "../components/studio/TopRightPill";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/$projectId/book")({ component: StudioBook });

function StudioBook() {
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
        current="book"
      />
      <TopLeftPill drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
      <BreadcrumbPill title={title} subtitle="Book" />
      <TopRightPill />
      <main
        className={`px-6 pt-28 pb-20 transition-[padding] ${drawerOpen ? "lg:pl-[19rem]" : ""}`}
      >
        <section className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
          <FullBookPanel projectId={projectId} />
        </section>
      </main>
    </div>
  );
}
