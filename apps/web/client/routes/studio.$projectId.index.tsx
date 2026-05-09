import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { LayoutTemplate, Plus, Settings2, Sparkles, Type, Wand2 } from "lucide-react";
import { useState } from "react";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { useStudioLayout } from "../components/studio/studio-layout-context";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/studio/$projectId/")({
  component: StudioCanvas,
});

type Scene = { id: string; title: string; body: string; rubric?: number };

const placeholderScenes: Scene[] = [
  {
    id: "s1",
    title: "Opening — A Quiet Morning",
    body: "The kettle complained before she did. Mira sat at the kitchen table with her hands wrapped around an idea she hadn't yet earned the right to call a plan.",
    rubric: 0.86,
  },
  {
    id: "s2",
    title: "Inciting Incident",
    body: "The letter arrived without ceremony — a folded thing in a stack of bills, but it changed the shape of the week before she'd even opened it.",
    rubric: 0.78,
  },
];

function StudioCanvas() {
  const { projectId } = Route.useParams();
  const { logline } = useSearch({ from: "/studio/$projectId" });
  const { drawerOpen } = useStudioLayout();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const [scenes, setScenes] = useState<Scene[]>(placeholderScenes);

  const insertAfter = (idx: number, kind: "blank" | "template" | "ai") => {
    const newScene: Scene = {
      id: `s${Date.now()}`,
      title:
        kind === "ai"
          ? "Generating…"
          : kind === "template"
            ? "New scene from template"
            : "New scene",
      body: kind === "ai" ? "✦ The agent is drafting this scene in your selected voice…" : "",
    };
    setScenes((prev) => [...prev.slice(0, idx + 1), newScene, ...prev.slice(idx + 1)]);
  };

  const title = project.data?.title ?? "Untitled book";

  return (
    <>
      <BreadcrumbPill title={title} subtitle={`Scene 1 of ${scenes.length}`} />
      <main
        className={`flex flex-col items-center gap-6 px-6 pt-28 pb-40 transition-[padding] ${
          drawerOpen ? "lg:pl-[19rem]" : ""
        }`}
      >
        {logline && (
          <div className="w-full max-w-3xl">
            <div className="rounded-2xl bg-neutral-950/90 px-5 py-3 text-neutral-200 ring-1 ring-white/5">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wide">Logline</div>
              <p className="mt-1 font-serif text-[15px] leading-relaxed">{logline}</p>
            </div>
          </div>
        )}
        {scenes.map((scene, i) => (
          <div className="w-full max-w-3xl group" key={scene.id}>
            <SceneCard scene={scene} index={i + 1} />
            <InsertBar onInsert={(kind) => insertAfter(i, kind)} />
          </div>
        ))}
      </main>
      <BottomToolbar />
      <AiOrb />
    </>
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

function SceneCard({ scene, index }: { scene: Scene; index: number }) {
  return (
    <article className="relative rounded-2xl bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 dark:bg-neutral-900/80 dark:ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-neutral-500 text-xs">Scene {index}</span>
        {scene.rubric !== undefined && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-[11px] text-emerald-700 dark:text-emerald-300">
            ✦ {Math.round(scene.rubric * 100)}
          </span>
        )}
      </div>
      <h2 className="mb-4 font-serif text-2xl tracking-tight">{scene.title}</h2>
      <p className="font-serif text-[17px] text-neutral-700 leading-relaxed dark:text-neutral-300">
        {scene.body || <span className="text-neutral-400 italic">Empty scene…</span>}
      </p>
    </article>
  );
}

function InsertBar({ onInsert }: { onInsert: (kind: "blank" | "template" | "ai") => void }) {
  return (
    <div className="my-3 flex justify-center opacity-0 transition group-hover:opacity-100 hover:opacity-100 has-[button:focus-visible]:opacity-100">
      <div className="flex items-center gap-1 rounded-full bg-neutral-950/90 p-1 text-neutral-200 text-sm shadow-lg ring-1 ring-white/5 backdrop-blur">
        <InsertButton icon={<Plus className="size-3.5" />} onClick={() => onInsert("blank")}>
          Blank scene
        </InsertButton>
        <InsertButton
          icon={<LayoutTemplate className="size-3.5" />}
          onClick={() => onInsert("template")}
        >
          Start with template
        </InsertButton>
        <InsertButton icon={<Wand2 className="size-3.5" />} onClick={() => onInsert("ai")}>
          Generate with AI
        </InsertButton>
      </div>
    </div>
  );
}

function InsertButton({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-white/10"
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function BottomToolbar() {
  return (
    <div className="-translate-x-1/2 fixed bottom-6 left-1/2 z-20 flex items-center gap-1 rounded-full bg-neutral-950/90 p-1 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur">
      <PillButton icon={<Plus className="size-4" />}>Insert</PillButton>
      <PillButton icon={<Wand2 className="size-4" />}>Remix</PillButton>
      <PillButton icon={<Type className="size-4" />}>Voice</PillButton>
      <PillButton icon={<LayoutTemplate className="size-4" />}>Background</PillButton>
      <button
        aria-label="More"
        className="grid size-9 place-items-center rounded-full hover:bg-white/10"
        type="button"
      >
        <Settings2 className="size-4" />
      </button>
    </div>
  );
}

function AiOrb() {
  return (
    <button
      aria-label="Open AI assistant"
      className="fixed right-5 bottom-5 z-20 grid size-11 place-items-center rounded-2xl bg-neutral-950 text-white shadow-xl ring-1 ring-white/10 hover:scale-105"
      type="button"
    >
      <Sparkles className="size-5" />
    </button>
  );
}
