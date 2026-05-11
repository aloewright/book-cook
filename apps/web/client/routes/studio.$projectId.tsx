import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AssistantPanel } from "../components/studio/AssistantPanel";

type CanvasSearch = { logline?: string };

export const Route = createFileRoute("/studio/$projectId")({
  validateSearch: (s: Record<string, unknown>): CanvasSearch => ({
    logline: typeof s.logline === "string" ? s.logline : undefined,
  }),
  beforeLoad: ({ params, search, location }) => {
    if (location.pathname === `/studio/${params.projectId}`) {
      throw redirect({
        to: "/studio/$projectId/outline",
        params,
        search,
        replace: true,
      });
    }
  },
  component: StudioProjectShell,
});

function StudioProjectShell() {
  const { projectId } = Route.useParams();
  return (
    <>
      <Outlet />
      {/* Mounted at the parent so the assistant's WebSocket survives child
          route changes (outline → marketplace → voice → book) and doesn't
          force a full page reload on reconnect. */}
      <AssistantPanel projectId={projectId} />
    </>
  );
}
