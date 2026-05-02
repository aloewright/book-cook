import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Boxes,
  FileText,
  Flag,
  Megaphone,
  Mic2,
  PackageCheck,
  Search,
} from "lucide-react";
import { cn } from "../../lib/utils";

const MODES = [
  { key: "concept", label: "Concept", icon: Search },
  { key: "voice", label: "Voice", icon: Mic2 },
  { key: "outline", label: "Outline", icon: Boxes },
  { key: "chapters", label: "Chapters", icon: FileText },
  { key: "book", label: "Book", icon: BookOpen },
  { key: "publish", label: "Publish", icon: PackageCheck },
  { key: "launch", label: "Launch", icon: Megaphone },
] as const;

export type WorkflowKey = (typeof MODES)[number]["key"];
export type WorkflowStatus = "not-started" | "in-progress" | "needs-review" | "approved";

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "needs-review": "Needs review",
  approved: "Approved",
};

const STATUS_DOTS: Record<WorkflowStatus, string> = {
  "not-started": "bg-muted-foreground/35",
  "in-progress": "bg-blue-500",
  "needs-review": "bg-amber-500",
  approved: "bg-emerald-500",
};

export function OutlineRail({
  active = "concept",
  statuses = {},
  onSelect,
}: {
  active?: WorkflowKey;
  statuses?: Partial<Record<WorkflowKey, WorkflowStatus>>;
  onSelect?: (mode: WorkflowKey) => void;
}) {
  const activeMode = active;
  const reduceMotion = useReducedMotion();

  return (
    <aside className="h-full min-h-0 w-full overflow-y-auto border-r bg-muted/30 p-3">
      <div className="mb-3 px-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Flag className="h-3 w-3" />
          Project
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const status = statuses[m.key] ?? "not-started";
          return (
            <button
              key={m.key}
              type="button"
              aria-label={`Go to ${m.label} workflow`}
              title={`${m.label}: ${STATUS_LABELS[status]}`}
              onClick={() => onSelect?.(m.key)}
              className={cn(
                "relative grid w-full grid-cols-[20px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                activeMode === m.key
                  ? "text-primary-foreground"
                  : "text-foreground hover:bg-accent",
              )}
            >
              {activeMode === m.key ? (
                <motion.span
                  layoutId="workflow-active-indicator"
                  className="absolute inset-0 rounded-md bg-primary"
                  transition={
                    reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.22, 1, 0.36, 1] }
                  }
                  aria-hidden
                />
              ) : null}
              <Icon className="relative h-4 w-4" aria-hidden />
              <span className="relative min-w-0 truncate">{m.label}</span>
              <span
                aria-label={STATUS_LABELS[status]}
                className={cn(
                  "relative h-2 w-2 rounded-full transition-colors",
                  activeMode === m.key ? "bg-primary-foreground/80" : STATUS_DOTS[status],
                )}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
