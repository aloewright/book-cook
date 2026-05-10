import { Download, Settings2, Share2, Sparkles } from "lucide-react";

export function TopRightPill({
  onShare,
  onExport,
  onReadAloud,
  shareLabel,
  exportPending,
  readAloudPending,
}: {
  onShare?: () => void;
  onExport?: () => void;
  onReadAloud?: () => void;
  shareLabel?: string;
  exportPending?: boolean;
  readAloudPending?: boolean;
} = {}) {
  return (
    <div className="fixed top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-neutral-950/90 px-2 py-1.5 text-neutral-200 shadow-lg ring-1 ring-white/5 backdrop-blur">
      <span className="grid size-7 place-items-center rounded-full bg-emerald-500/20 font-semibold text-[11px] text-emerald-300">
        H
      </span>
      <PillButton icon={<Share2 className="size-3.5" />} onClick={onShare}>
        {shareLabel ?? "Share"}
      </PillButton>
      <PillButton
        disabled={exportPending}
        icon={<Download className="size-3.5" />}
        onClick={onExport}
      >
        {exportPending ? "Exporting…" : "Export"}
      </PillButton>
      <PillButton
        disabled={readAloudPending}
        icon={<Sparkles className="size-3.5" />}
        onClick={onReadAloud}
      >
        {readAloudPending ? "Loading…" : "Read aloud"}
      </PillButton>
      <button
        aria-label="More"
        className="grid size-8 place-items-center rounded-full hover:bg-white/10"
        type="button"
      >
        <Settings2 className="size-3.5" />
      </button>
    </div>
  );
}

function PillButton({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
