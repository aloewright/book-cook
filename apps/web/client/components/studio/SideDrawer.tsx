import { Link } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  Gift,
  Home,
  LayoutTemplate,
  PanelLeftClose,
  Plus,
  Sparkles,
  Type,
} from "lucide-react";

export function SideDrawer({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
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

      <button
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left hover:bg-white/10"
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-emerald-500/20 font-semibold text-emerald-300 text-xs">
            H
          </span>
          <span className="flex flex-col">
            <span className="font-medium text-sm">Hello</span>
            <span className="text-[11px] text-neutral-400">Pro plan</span>
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 text-neutral-400" />
      </button>

      <nav className="mt-4 flex flex-col gap-0.5">
        <DrawerLink icon={<Home className="size-4" />} to="/studio">
          Home
        </DrawerLink>
        <DrawerLink icon={<Plus className="size-4" />} to="/studio/compose">
          New book
        </DrawerLink>
        <DrawerLinkPlain icon={<LayoutTemplate className="size-4" />}>Templates</DrawerLinkPlain>
        <DrawerLinkPlain icon={<Type className="size-4" />}>Voices</DrawerLinkPlain>
        <DrawerLinkPlain icon={<Gift className="size-4" />}>Refer & earn</DrawerLinkPlain>
      </nav>

      <div className="mt-5 px-3 text-[11px] text-neutral-500 uppercase tracking-wide">
        This book
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        <RecentLink to="/studio/$projectId" params={{ projectId }} activeOptions={{ exact: true }}>
          Canvas
        </RecentLink>
        <RecentLink to="/studio/$projectId/outline" params={{ projectId }}>
          Outline
        </RecentLink>
        <RecentLink to="/studio/$projectId/marketplace" params={{ projectId }}>
          Marketplace
        </RecentLink>
        <RecentLink to="/studio/$projectId/voice" params={{ projectId }}>
          Voice
        </RecentLink>
      </div>
      <div className="mt-3 px-3 text-[11px] text-neutral-500">
        project: {projectId.slice(0, 6)}…
      </div>
    </aside>
  );
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

function DrawerLinkPlain({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
      type="button"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function RecentLink({
  children,
  to,
  params,
  activeOptions,
}: {
  children: React.ReactNode;
  to: string;
  params: Record<string, string>;
  activeOptions?: { exact?: boolean };
}) {
  return (
    <Link
      to={to}
      params={params}
      activeOptions={activeOptions}
      className="truncate rounded-lg px-3 py-2 text-left text-sm"
      activeProps={{ className: "bg-white/10 text-neutral-100" }}
      inactiveProps={{ className: "text-neutral-400 hover:bg-white/5" }}
    >
      {children}
    </Link>
  );
}
