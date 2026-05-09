import { PanelLeft } from "lucide-react";

export function TopLeftPill({
  drawerOpen,
  onToggleDrawer,
}: {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}) {
  if (drawerOpen) return null;
  return (
    <div className="fixed top-4 left-4 z-20 flex items-center gap-1 rounded-full bg-neutral-950/90 px-2 py-1.5 text-neutral-200 shadow-lg ring-1 ring-white/5 backdrop-blur">
      <button
        aria-label="Open drawer"
        className="grid size-8 place-items-center rounded-full hover:bg-white/10"
        onClick={onToggleDrawer}
        type="button"
      >
        <PanelLeft className="size-4" />
      </button>
    </div>
  );
}
