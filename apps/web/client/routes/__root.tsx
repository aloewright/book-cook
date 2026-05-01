import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { BookOpen, Compass, LayoutDashboard, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scout", label: "Scout", icon: Compass },
  { to: "/account", label: "Settings", icon: Settings },
] as const;

export const Route = createRootRoute({
  component: () => (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
          <Link
            to="/"
            aria-label="Book Cook home"
            title="Book Cook"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
          >
            <BookOpen className="h-5 w-5" />
          </Link>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground"
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  ),
});
