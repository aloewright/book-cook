import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, Settings, Shield } from "lucide-react";
import { api, queryKeys } from "../lib/api";

const BASE_NAV = [
  { to: "/studio", label: "Studio", icon: LayoutDashboard },
  { to: "/account", label: "Settings", icon: Settings },
] as const;

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  // Canvas route: /studio/{projectId} — has its own full-screen layered UI
  const isCanvas = /^\/studio\/(?!compose\b)[^/]+$/.test(location.pathname);

  const session = useQuery({
    queryKey: queryKeys.me(),
    queryFn: api.maybeMe,
    retry: false,
    staleTime: 30_000,
  });
  const admin = useQuery({
    queryKey: ["admin", "me"],
    queryFn: api.adminMe,
    retry: false,
    staleTime: 30_000,
    enabled: !!session.data?.user,
  });

  const navItems = admin.data?.is_admin
    ? ([
        { to: "/studio", label: "Studio", icon: LayoutDashboard },
        { to: "/admin", label: "Admin", icon: Shield },
        { to: "/account", label: "Settings", icon: Settings },
      ] as const)
    : BASE_NAV;

  const homeLink = session.data?.user ? (
    <Link
      to="/studio"
      aria-label="Book Cook home"
      title="Book Cook"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
    >
      <BookOpen className="h-5 w-5" />
    </Link>
  ) : (
    <Link
      to="/"
      aria-label="Book Cook home"
      title="Book Cook"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
    >
      <BookOpen className="h-5 w-5" />
    </Link>
  );

  if (isCanvas) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <header className="shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
          {homeLink}
          <nav className="flex gap-1">
            {navItems.map((item) => (
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
  );
}
