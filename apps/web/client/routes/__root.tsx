import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  // Canvas route: /studio/{projectId} — has its own full-screen layered UI
  const isCanvas = /^\/studio\/(?!compose\b)[^/]+$/.test(location.pathname);

  if (isCanvas) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
