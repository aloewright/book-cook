import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Home,
  PanelLeftClose,
  Plus,
  Settings,
  Share2,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, queryKeys } from "../../lib/api";
import { SettingsPanel } from "./SettingsPanel";

export type StudioSection = "canvas" | "outline" | "marketplace" | "voice" | "book";

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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const active = current ?? sectionFromPathname(location.pathname, projectId);
  const session = useQuery({ queryKey: queryKeys.me(), queryFn: api.maybeMe });
  const user = session.data?.user;
  const email = user?.email ?? "";
  const displayName = user?.name?.trim() || email;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "·";
  const plan = user?.plan ? `${user.plan} plan` : "Signed in";

  const exportMutation = useMutation({
    mutationFn: () => api.startBookExport(projectId, { formats: ["epub", "pdf"] }),
    onSuccess: () => {
      setMenuOpen(false);
      navigate({ to: "/studio/$projectId/book", params: { projectId } });
    },
  });

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => setShareLabel("Copied!"))
        .catch(() => setShareLabel("Copy failed"));
    }
  }

  useEffect(() => {
    if (!shareLabel) return;
    const id = window.setTimeout(() => setShareLabel(null), 2000);
    return () => window.clearTimeout(id);
  }, [shareLabel]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

  const iconCls = "size-4 shrink-0";

  if (!open) return null;

  if (collapsed) {
    return (
      <>
        <aside
          aria-label="Navigation"
          className="-translate-y-1/2 fixed top-1/2 left-4 z-30 flex flex-col items-center gap-1 rounded-3xl bg-neutral-950/95 p-2 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur transition-all duration-300"
        >
          <button
            aria-label="Expand navigation"
            className="grid size-8 place-items-center rounded-full hover:bg-white/10"
            onClick={() => setCollapsed(false)}
            type="button"
            title="Expand"
          >
            <ChevronRight className={iconCls} />
          </button>

          <div className="my-1 h-px w-6 bg-white/10" />

          <IconNavLink icon={<Home className={iconCls} />} to="/studio" label="Home" />
          <IconNavLink icon={<Plus className={iconCls} />} to="/studio/compose" label="New book" />
          <IconNavLink
            icon={<Type className={iconCls} />}
            to={`/studio/${projectId}/voice`}
            label="Voice"
          />

          <div className="my-1 h-px w-6 bg-white/10" />

          <IconSectionLink
            to={`/studio/${projectId}`}
            label="Canvas"
            active={active === "canvas"}
          />
          <IconSectionLink
            to={`/studio/${projectId}/outline`}
            label="Outline"
            active={active === "outline"}
          />
          <IconSectionLink
            to={`/studio/${projectId}/marketplace`}
            label="Market"
            active={active === "marketplace"}
          />
          <IconSectionLink
            to={`/studio/${projectId}/voice`}
            label="Voice"
            active={active === "voice"}
          />
          <IconSectionLink
            to={`/studio/${projectId}/book`}
            label="Book"
            active={active === "book"}
          />

          <div className="my-1 h-px w-6 bg-white/10" />

          <button
            aria-label="Open user menu"
            className="grid size-8 place-items-center rounded-md bg-emerald-500/20 font-semibold text-emerald-300 text-xs hover:bg-emerald-500/30"
            onClick={() => setMenuOpen((v) => !v)}
            title={displayName}
            type="button"
          >
            {initial}
          </button>

          <button
            aria-label="Close navigation"
            className="grid size-8 place-items-center rounded-full hover:bg-white/10"
            onClick={onClose}
            type="button"
            title="Close"
          >
            <PanelLeftClose className={iconCls} />
          </button>
        </aside>
        {menuOpen && (
          <UserMenu
            anchor="collapsed"
            menuRef={menuRef}
            displayName={displayName}
            plan={plan}
            initial={initial}
            shareLabel={shareLabel}
            exportPending={exportMutation.isPending}
            onShare={handleShare}
            onExport={() => exportMutation.mutate()}
            onSettings={() => {
              setMenuOpen(false);
              setSettingsOpen(true);
            }}
          />
        )}
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <aside
        aria-label="Navigation"
        className="-translate-y-1/2 fixed top-1/2 left-4 z-30 flex max-h-[calc(100vh-2rem)] w-64 flex-col overflow-y-auto rounded-3xl bg-neutral-950/95 p-3 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4" />
            <span className="font-medium text-sm">Book Cook · Studio</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Collapse navigation"
              className="rounded-md p-1 hover:bg-white/10"
              onClick={() => setCollapsed(true)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Close navigation"
              className="rounded-md p-1 hover:bg-white/10"
              onClick={onClose}
              type="button"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
        </div>

        {/* Global nav */}
        <nav className="mt-4 flex flex-col gap-0.5">
          <DrawerLink icon={<Home className={iconCls} />} to="/studio">
            Home
          </DrawerLink>
          <DrawerLink icon={<Plus className={iconCls} />} to="/studio/compose">
            New book
          </DrawerLink>
          <Link
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
            params={{ projectId }}
            to="/studio/$projectId/voice"
          >
            <Type className={iconCls} />
            <span>Voice library</span>
          </Link>
        </nav>

        {/* This book */}
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
          <RecentLink
            to="/studio/$projectId/book"
            params={{ projectId }}
            active={active === "book"}
          >
            Book
          </RecentLink>
        </div>

        {/* Spacer pushes user section to bottom */}
        <div className="flex-1" />

        {/* User chip — opens user menu */}
        <div className="relative">
          <button
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="mt-4 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left hover:bg-white/10"
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/20 font-semibold text-emerald-300 text-xs">
                {initial}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-sm">
                  {user ? displayName : session.isLoading ? "Loading…" : "Sign in"}
                </span>
                <span className="text-[11px] text-neutral-400">{plan}</span>
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-neutral-400" />
          </button>
          {menuOpen && (
            <UserMenu
              anchor="expanded"
              menuRef={menuRef}
              displayName={displayName}
              plan={plan}
              initial={initial}
              shareLabel={shareLabel}
              exportPending={exportMutation.isPending}
              onShare={handleShare}
              onExport={() => exportMutation.mutate()}
              onSettings={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
            />
          )}
        </div>
      </aside>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function UserMenu({
  anchor,
  menuRef,
  displayName,
  plan,
  initial,
  shareLabel,
  exportPending,
  onShare,
  onExport,
  onSettings,
}: {
  anchor: "collapsed" | "expanded";
  menuRef: React.RefObject<HTMLDivElement | null>;
  displayName: string;
  plan: string;
  initial: string;
  shareLabel: string | null;
  exportPending: boolean;
  onShare: () => void;
  onExport: () => void;
  onSettings: () => void;
}) {
  const positionClass =
    anchor === "collapsed"
      ? "fixed bottom-4 left-20 z-40"
      : "absolute bottom-full left-0 right-0 mb-2 z-40";
  return (
    <div
      ref={menuRef}
      role="menu"
      className={`${positionClass} flex w-56 flex-col gap-1 rounded-xl bg-neutral-900 p-1 text-neutral-100 shadow-2xl ring-1 ring-white/10`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/20 font-semibold text-emerald-300 text-xs">
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-sm">{displayName}</span>
          <span className="text-[11px] text-neutral-400">{plan}</span>
        </span>
      </div>
      <div className="my-0.5 h-px bg-white/10" />
      <MenuItem icon={<Share2 className="size-3.5" />} onClick={onShare}>
        {shareLabel ?? "Share"}
      </MenuItem>
      <MenuItem
        icon={<Download className="size-3.5" />}
        onClick={onExport}
        disabled={exportPending}
      >
        {exportPending ? "Exporting…" : "Export"}
      </MenuItem>
      <MenuItem icon={<Settings className="size-3.5" />} onClick={onSettings}>
        Settings
      </MenuItem>
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function sectionFromPathname(pathname: string, projectId: string): StudioSection {
  const base = `/studio/${projectId}`;
  if (pathname === `${base}/outline` || pathname.startsWith(`${base}/outline/`)) return "outline";
  if (pathname === `${base}/marketplace` || pathname.startsWith(`${base}/marketplace/`))
    return "marketplace";
  if (pathname === `${base}/voice` || pathname.startsWith(`${base}/voice/`)) return "voice";
  if (pathname === `${base}/book` || pathname.startsWith(`${base}/book/`)) return "book";
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

function IconNavLink({
  icon,
  to,
  label,
}: {
  icon: React.ReactNode;
  to: string;
  label: string;
}) {
  return (
    <Link
      className="grid size-8 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
      title={label}
      to={to}
    >
      {icon}
    </Link>
  );
}

function IconSectionLink({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      className={`rounded-lg px-2 py-1 text-center text-[10px] transition ${
        active
          ? "bg-white/10 text-neutral-100"
          : "text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
      }`}
      title={label}
      to={to}
    >
      {label.slice(0, 3)}
    </Link>
  );
}
