import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
          <Link to="/" className="font-semibold">
            📚 Book Cook
          </Link>
          <nav className="flex gap-4">
            <Link
              to="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/scout"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Scout
            </Link>
            <Link
              to="/account"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Account
            </Link>
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  ),
});
