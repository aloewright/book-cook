import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});
