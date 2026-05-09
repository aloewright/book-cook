import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { TopRightPill } from "../components/studio/TopRightPill";
import { StudioLayoutProvider } from "../components/studio/studio-layout-context";

type CanvasSearch = { logline?: string };

export const Route = createFileRoute("/studio/$projectId")({
  component: StudioProjectLayout,
  validateSearch: (s: Record<string, unknown>): CanvasSearch => ({
    logline: typeof s.logline === "string" ? s.logline : undefined,
  }),
});

function StudioProjectLayout() {
  const { projectId } = Route.useParams();
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <StudioLayoutProvider value={{ drawerOpen }}>
      <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
        <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} projectId={projectId} />
        <TopLeftPill drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
        <TopRightPill />
        <Outlet />
      </div>
    </StudioLayoutProvider>
  );
}
