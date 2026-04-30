import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background">
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
      <main>
        <Outlet />
      </main>
    </div>
  ),
});
