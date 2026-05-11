import { PanelRightClose, Sparkles } from "lucide-react";
import { EditorialAssistantSidecar } from "../chat/aloysius-sidecar";

export function AssistantPanel({
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
      className={`fixed top-4 right-4 bottom-4 z-30 flex w-72 flex-col rounded-3xl bg-neutral-950/95 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur transition-transform ${
        open ? "translate-x-0" : "translate-x-[110%]"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" />
          <span className="font-medium text-sm">Editorial Assistant</span>
        </div>
        <button
          aria-label="Close assistant"
          className="rounded-md p-1 hover:bg-white/10"
          onClick={onClose}
          type="button"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <EditorialAssistantSidecar projectId={projectId} />
      </div>
    </aside>
  );
}
