import { cn } from "../../lib/utils";

const MODES = [
  { key: "concept", label: "Concept", icon: "◷" },
  { key: "voice", label: "Voice", icon: "🎤" },
  { key: "outline", label: "Outline", icon: "🗂" },
  { key: "chapters", label: "Chapters", icon: "✏️" },
  { key: "publish", label: "Publish", icon: "📦" },
  { key: "launch", label: "Launch", icon: "🚀" },
] as const;

export function OutlineRail({ active = "concept" }: { active?: (typeof MODES)[number]["key"] }) {
  return (
    <aside className="w-full border-r bg-muted/30 p-3">
      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Project
      </div>
      <div className="flex flex-col gap-0.5">
        {MODES.map((m) => (
          <div
            key={m.key}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              active === m.key
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent",
            )}
          >
            <span aria-hidden>{m.icon}</span>
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
