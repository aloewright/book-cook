import { Download, Settings2, Share2, Sparkles } from "lucide-react";

export function TopRightPill() {
  return (
    <div className="fixed top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-neutral-950/90 px-2 py-1.5 text-neutral-200 shadow-lg ring-1 ring-white/5 backdrop-blur">
      <span className="grid size-7 place-items-center rounded-full bg-emerald-500/20 font-semibold text-[11px] text-emerald-300">
        H
      </span>
      <PillButton icon={<Share2 className="size-3.5" />}>Share</PillButton>
      <PillButton icon={<Download className="size-3.5" />}>Export</PillButton>
      <PillButton icon={<Sparkles className="size-3.5" />}>Read aloud</PillButton>
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

function PillButton({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/10"
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
