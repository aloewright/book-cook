import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { BookOpen, Compass, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { api, queryKeys } from "../lib/api";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scout", label: "Scout", icon: Compass },
  { to: "/account", label: "Settings", icon: Settings },
] as const;

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const session = useQuery({
    queryKey: queryKeys.me(),
    queryFn: api.maybeMe,
    retry: false,
    staleTime: 30_000,
  });
  const billing = useQuery({
    queryKey: queryKeys.billing(),
    queryFn: api.getBillingStatus,
    enabled: Boolean(session.data?.user),
    retry: false,
    staleTime: 30_000,
  });
  const showProCta = Boolean(session.data?.user && billing.data?.publish_launch_unlocked === false);
  const homeLink = session.data?.user ? (
    <Link
      to="/dashboard"
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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
          {homeLink}
          <nav className="flex items-center gap-1">
            {showProCta ? (
              <Button asChild size="sm" className="mr-2 hidden sm:inline-flex">
                <Link to="/pricing">Sign up for Pro</Link>
              </Button>
            ) : null}
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
  );
}
