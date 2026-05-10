import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ChapterEditorPanel from "../components/panels/ChapterEditorPanel";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { TopRightPill } from "../components/studio/TopRightPill";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/$projectId/chapters/$chapterId")({
  component: StudioChapter,
});

function StudioChapter() {
  const { projectId, chapterId } = Route.useParams();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const chapter = useQuery({
    queryKey: queryKeys.chapter(chapterId),
    queryFn: () => api.getChapter(chapterId),
  });
  const [drawerOpen, setDrawerOpen] = useState(true);
  const title = project.data?.title ?? "Untitled book";
  const subtitle = chapter.data
    ? `Chapter ${chapter.data.ordinal} · ${chapter.data.title || "Untitled"}`
    : "Chapter";

  return (
    <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={projectId}
        current="canvas"
      />
      <TopLeftPill drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
      <BreadcrumbPill title={title} subtitle={subtitle} />
      <TopRightPill />
      <main
        className={`px-6 pt-28 pb-20 transition-[padding] ${drawerOpen ? "lg:pl-[19rem]" : ""}`}
      >
        <div className="mx-auto max-w-5xl">
          <ChapterEditorPanel projectId={projectId} chapterId={chapterId} />
        </div>
      </main>
    </div>
  );
}
