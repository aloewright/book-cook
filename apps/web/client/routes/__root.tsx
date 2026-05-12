import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

// Single stable wrapper for every route. Previously we branched on a regex
// ("is this the canvas?") which rendered two different DOM shapes — and the
// bare /studio/{id} path matched the canvas branch, then immediately
// redirected to /studio/{id}/outline which didn't, so the root tree
// unmounted + remounted, causing a visible "double load" of the page +
// re-establishing the chat WebSocket twice. One root wrapper avoids that.
function RootLayout() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <Outlet />
    </div>
  );
}
