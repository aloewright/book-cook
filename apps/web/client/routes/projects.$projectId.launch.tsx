import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/launch")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/studio/$projectId/marketplace",
      params: { projectId: params.projectId },
      search: { tab: "launch" as const },
      replace: true,
    });
  },
  component: () => null,
});
