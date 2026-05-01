import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const MODES = [
  { key: "concept", label: "Concept", icon: "◷" },
  { key: "voice", label: "Voice", icon: "🎤" },
  { key: "outline", label: "Outline", icon: "🗂" },
  { key: "chapters", label: "Chapters", icon: "✏️" },
  { key: "book", label: "Book", icon: "📖" },
  { key: "publish", label: "Publish", icon: "📦" },
  { key: "launch", label: "Launch", icon: "🚀" },
] as const;

export function OutlineRail({ active = "concept" }: { active?: (typeof MODES)[number]["key"] }) {
  const [activeMode, setActiveMode] = useState(active);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (MODES.some((mode) => mode.key === hash)) {
        setActiveMode(hash as (typeof MODES)[number]["key"]);
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ block: "start" });
          window.scrollTo(0, 0);
        });
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <aside className="h-full min-h-0 w-full overflow-y-auto border-r bg-muted/30 p-3">
      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Project
      </div>
      <div className="flex flex-col gap-0.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-label={`Go to ${m.label} workflow`}
            onClick={() => {
              if (m.key === "book") {
                window.location.assign(`${window.location.pathname.replace(/\/$/, "")}/book`);
                return;
              }
              setActiveMode(m.key);
              document.getElementById(m.key)?.scrollIntoView({ block: "start" });
              history.replaceState(null, "", `#${m.key}`);
              window.scrollTo(0, 0);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
              activeMode === m.key
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent",
            )}
          >
            <span aria-hidden>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
