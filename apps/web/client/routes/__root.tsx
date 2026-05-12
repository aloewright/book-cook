import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { AssistantPanel } from "../components/studio/AssistantPanel";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  // Extract the project id from any /studio/{id}/... pathname. The chat
  // panel mounts at the ROOT so it survives any nested route transition
  // (including the bare /studio/{id} → /studio/{id}/outline beforeLoad
  // redirect, which previously caused the studio.$projectId shell to
  // remount and the WebSocket to reconnect twice on arrival).
  const studioMatch = location.pathname.match(/^\/studio\/([^/]+)(?:\/|$)/);
  const studioProjectId =
    studioMatch && studioMatch[1] !== "compose" && studioMatch[1] !== "new" ? studioMatch[1] : null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <Outlet />
      {studioProjectId && <AssistantPanel key={studioProjectId} projectId={studioProjectId} />}
    </div>
  );
}
