import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsUpDown, Home, PanelLeftClose, Plus, Sparkles, Type } from "lucide-react";
import { api, queryKeys } from "../../lib/api";

export type StudioSection = "canvas" | "outline" | "marketplace" | "voice";

export function SideDrawer({
  open,
  onClose,
  projectId,
  current,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  current?: StudioSection;
}) {
  const location = useLocation();
  const active = current ?? sectionFromPathname(location.pathname, projectId);
  const session = useQuery({ queryKey: queryKeys.me(), queryFn: api.maybeMe });
  const user = session.data?.user;
  const email = user?.email ?? "";
  const initial = email ? email.charAt(0).toUpperCase() : "·";
  const plan = user?.plan ? `${user.plan} plan` : "Signed in";

  return (
    <aside
      aria-hidden={!open}
      className={`fixed top-4 bottom-4 left-4 z-30 w-64 rounded-3xl bg-neutral-950/95 p-3 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur transition-transform ${
        open ? "translate-x-0" : "-translate-x-[110%]"
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" />
          <span className="font-medium text-sm">Book Cook · Studio</span>
        </div>
        <button
          aria-label="Close drawer"
          className="rounded-md p-1 hover:bg-white/10"
          onClick={onClose}
          type="button"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <Link
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left hover:bg-white/10"
        to="/account"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/20 font-semibold text-emerald-300 text-xs">
            {initial}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-sm">
              {user ? email : session.isLoading ? "Loading…" : "Sign in"}
            </span>
            <span className="text-[11px] text-neutral-400">{plan}</span>
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-neutral-400" />
      </Link>

      <nav className="mt-4 flex flex-col gap-0.5">
        <DrawerLink icon={<Home className="size-4" />} to="/studio">
          Home
        </DrawerLink>
        <DrawerLink icon={<Plus className="size-4" />} to="/studio/compose">
          New book
        </DrawerLink>
        <Link
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          params={{ projectId }}
          to="/studio/$projectId/voice"
        >
          <Type className="size-4" />
          <span>Voices</span>
        </Link>
      </nav>

      <div className="mt-5 px-3 text-[11px] text-neutral-500 uppercase tracking-wide">
        This book
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        <RecentLink to="/studio/$projectId" params={{ projectId }} active={active === "canvas"}>
          Canvas
        </RecentLink>
        <RecentLink
          to="/studio/$projectId/outline"
          params={{ projectId }}
          active={active === "outline"}
        >
          Outline
        </RecentLink>
        <RecentLink
          to="/studio/$projectId/marketplace"
          params={{ projectId }}
          active={active === "marketplace"}
        >
          Marketplace
        </RecentLink>
        <RecentLink
          to="/studio/$projectId/voice"
          params={{ projectId }}
          active={active === "voice"}
        >
          Voice
        </RecentLink>
      </div>
      <div className="mt-3 px-3 text-[11px] text-neutral-500">
        project: {projectId.slice(0, 6)}…
      </div>
    </aside>
  );
}

function sectionFromPathname(pathname: string, projectId: string): StudioSection {
  const base = `/studio/${projectId}`;
  if (pathname === `${base}/outline` || pathname.startsWith(`${base}/outline/`)) return "outline";
  if (pathname === `${base}/marketplace` || pathname.startsWith(`${base}/marketplace/`))
    return "marketplace";
  if (pathname === `${base}/voice` || pathname.startsWith(`${base}/voice/`)) return "voice";
  return "canvas";
}

function DrawerLink({
  icon,
  children,
  to,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
      to={to}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function RecentLink({
  children,
  to,
  params,
  active,
}: {
  children: React.ReactNode;
  to: string;
  params: Record<string, string>;
  active?: boolean;
}) {
  return (
    <Link
      className={`truncate rounded-lg px-3 py-2 text-left text-sm ${
        active ? "bg-white/10 text-neutral-100" : "text-neutral-400 hover:bg-white/5"
      }`}
      to={to}
      params={params}
    >
      {children}
    </Link>
  );
}
