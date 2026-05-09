import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { LayoutTemplate, Plus, Settings2, Sparkles, Type, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { TopRightPill } from "../components/studio/TopRightPill";
import { type Chapter, type Section, api, queryKeys } from "../lib/api";

type CanvasSearch = { logline?: string };

export const Route = createFileRoute("/studio/$projectId")({
  component: StudioProject,
  validateSearch: (s: Record<string, unknown>): CanvasSearch => ({
    logline: typeof s.logline === "string" ? s.logline : undefined,
  }),
});

const TEMPLATE_INSTRUCTION =
  "Use a classic three-beat scene structure: a clear setup, an escalating turn, and a payoff that lands the chapter's promise.";

function StudioProject() {
  const { projectId } = Route.useParams();
  const { logline } = Route.useSearch();
  const location = useLocation();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(projectId),
    queryFn: () => api.getProjectOutline(projectId),
  });
  const [drawerOpen, setDrawerOpen] = useState(true);

  if (location.pathname !== `/studio/${projectId}`) {
    return <Outlet />;
  }

  const title = project.data?.title ?? "Untitled book";
  const chapters = outline.data?.chapters ?? [];
  const subtitle =
    chapters.length === 0
      ? "No chapters yet"
      : `${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`;

  return (
    <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={projectId}
        current="canvas"
      />
      <TopLeftPill drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((v) => !v)} />
      <BreadcrumbPill title={title} subtitle={subtitle} />
      <TopRightPill />

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

        {outline.isLoading && (
          <p className="font-serif text-neutral-500 text-sm">Loading scenes…</p>
        )}

        {!outline.isLoading && chapters.length === 0 && <EmptyOutline projectId={projectId} />}

        {chapters.map((chapter) => (
          <ChapterCanvas key={chapter.id} chapter={chapter} />
        ))}
      </main>

      <BottomToolbar />
      <AiOrb />
    </div>
  );
}

function ChapterCanvas({ chapter }: { chapter: Chapter }) {
  const queryClient = useQueryClient();
  const sections = useQuery({
    queryKey: queryKeys.chapterSections(chapter.id),
    queryFn: () => api.getChapterSections(chapter.id),
  });

  const draftMutation = useMutation({
    mutationFn: (input: { sectionId: string; instruction?: string }) =>
      api.draftSection(chapter.id, input.sectionId, { instruction: input.instruction }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
    },
  });

  const blankMutation = useMutation({
    mutationFn: (sectionId: string) =>
      api.updateSection(chapter.id, sectionId, { draft_md: "", status: "drafted" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
    },
  });

  const items = sections.data?.items ?? [];
  const pendingSectionId = draftMutation.isPending ? draftMutation.variables?.sectionId : undefined;
  const insertBusy = draftMutation.isPending || blankMutation.isPending;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <ChapterHeading chapter={chapter} />
      {sections.isLoading ? (
        <p className="rounded-2xl bg-white/60 px-5 py-4 font-serif text-neutral-600 text-sm dark:bg-neutral-900/60 dark:text-neutral-400">
          Loading scenes…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-5 py-4 font-serif text-neutral-600 text-sm dark:bg-neutral-900/60 dark:text-neutral-400">
          No sections in this chapter yet.
        </p>
      ) : (
        items.map((section, i) => (
          <div className="group" key={section.id}>
            <SceneCard
              section={section}
              chapterId={chapter.id}
              index={i + 1}
              isGenerating={pendingSectionId === section.id}
            />
            <InsertBar
              disabled={insertBusy}
              onAction={(kind) => {
                if (kind === "blank") {
                  blankMutation.mutate(section.id);
                  return;
                }
                draftMutation.mutate({
                  sectionId: section.id,
                  instruction: kind === "template" ? TEMPLATE_INSTRUCTION : undefined,
                });
              }}
            />
          </div>
        ))
      )}
    </div>
  );
}

function ChapterHeading({ chapter }: { chapter: Chapter }) {
  return (
    <div className="px-1">
      <div className="text-[11px] text-neutral-500 uppercase tracking-wide">
        Chapter {chapter.ordinal}
      </div>
      <h2 className="mt-1 font-serif text-2xl tracking-tight">{chapter.title}</h2>
      {chapter.summary && (
        <p className="mt-1 font-serif text-[14px] text-neutral-600 leading-relaxed dark:text-neutral-400">
          {chapter.summary}
        </p>
      )}
    </div>
  );
}

function EmptyOutline({ projectId }: { projectId: string }) {
  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white/80 p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 dark:bg-neutral-900/80 dark:ring-white/5">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        <Sparkles className="size-5" />
      </div>
      <h2 className="mt-4 font-serif text-2xl tracking-tight">No outline yet</h2>
      <p className="mx-auto mt-2 max-w-md font-serif text-[15px] text-neutral-600 leading-relaxed dark:text-neutral-400">
        Generate an outline first — then chapters and scenes will appear here as cards you can edit
        and remix.
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 font-medium text-neutral-100 text-sm shadow-lg ring-1 ring-white/10 hover:bg-neutral-800"
        params={{ projectId }}
        to="/projects/$projectId"
      >
        <Wand2 className="size-3.5" />
        Generate outline
      </Link>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function SceneCard({
  section,
  chapterId,
  index,
  isGenerating,
}: {
  section: Section;
  chapterId: string;
  index: number;
  isGenerating: boolean;
}) {
  const [draft, setDraft] = useState(section.draft_md);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedRef = useRef(section.draft_md);
  const draftRef = useRef(section.draft_md);
  const timerRef = useRef<number | undefined>(undefined);
  const inFlightRef = useRef<AbortController | null>(null);
  const saveGenRef = useRef(0);
  const sectionId = section.id;

  // Re-sync from the server only when the user has no unsaved local edits and
  // we're not mid-save — otherwise a background refetch would overwrite typing.
  useEffect(() => {
    if (draftRef.current !== lastSavedRef.current) return;
    if (saveState === "saving") return;
    if (section.draft_md === lastSavedRef.current) return;
    draftRef.current = section.draft_md;
    lastSavedRef.current = section.draft_md;
    setDraft(section.draft_md);
    setSaveState("idle");
  }, [section.draft_md, saveState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      inFlightRef.current?.abort();
    };
  }, []);

  function scheduleSave(next: string) {
    draftRef.current = next;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (next === lastSavedRef.current) {
      setSaveState("idle");
      return;
    }
    setSaveState("saving");
    timerRef.current = window.setTimeout(async () => {
      // Cancel any in-flight save so its response can't clobber a newer one.
      inFlightRef.current?.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      const gen = ++saveGenRef.current;
      try {
        await api.updateSection(
          chapterId,
          sectionId,
          { draft_md: next },
          { signal: controller.signal },
        );
        if (gen !== saveGenRef.current) return;
        lastSavedRef.current = next;
        setSaveState("saved");
      } catch {
        if (controller.signal.aborted) return;
        if (gen !== saveGenRef.current) return;
        setSaveState("error");
      }
    }, 800);
  }

  const heading = sectionTitle(section);

  return (
    <article className="relative rounded-2xl bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 dark:bg-neutral-900/80 dark:ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-neutral-500 text-xs">Scene {index}</span>
        <SaveIndicator saveState={saveState} status={section.status} />
      </div>
      <h2 className="mb-4 font-serif text-2xl tracking-tight">{heading}</h2>
      {isGenerating ? (
        <SceneSkeleton />
      ) : (
        <textarea
          aria-label={`Scene ${index} body`}
          className="w-full resize-y bg-transparent font-serif text-[17px] text-neutral-700 leading-relaxed outline-none placeholder:text-neutral-400 placeholder:italic focus:bg-neutral-50/60 focus:rounded-lg focus:px-2 focus:-mx-2 dark:text-neutral-300 dark:focus:bg-neutral-800/40"
          onChange={(e) => {
            setDraft(e.target.value);
            scheduleSave(e.target.value);
          }}
          placeholder="Empty scene…"
          rows={Math.min(20, Math.max(4, draft.split("\n").length + 1))}
          value={draft}
        />
      )}
    </article>
  );
}

function SaveIndicator({ saveState, status }: { saveState: SaveState; status: Section["status"] }) {
  if (saveState === "saving") {
    return <span className="text-[11px] text-neutral-500">Saving…</span>;
  }
  if (saveState === "saved") {
    return <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Saved</span>;
  }
  if (saveState === "error") {
    return <span className="text-[11px] text-red-600 dark:text-red-400">Save failed</span>;
  }
  return (
    <span className="rounded-full bg-neutral-200/60 px-2 py-0.5 font-medium text-[11px] text-neutral-700 dark:bg-white/5 dark:text-neutral-300">
      {status}
    </span>
  );
}

function SceneSkeleton() {
  return (
    <div className="animate-pulse space-y-2 py-1">
      <div className="h-4 w-11/12 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-10/12 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-9/12 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-8/12 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

function sectionTitle(section: Section) {
  if (section.prompt.trim()) {
    const firstLine = section.prompt.split(/\n|\.|;/)[0]?.trim();
    if (firstLine) return truncate(firstLine, 80);
  }
  return `${humanKind(section.kind)} ${section.ordinal}`;
}

function humanKind(kind: string) {
  if (!kind) return "Scene";
  const cleaned = kind.replace(/[-_]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function InsertBar({
  disabled,
  onAction,
}: {
  disabled: boolean;
  onAction: (kind: "blank" | "template" | "ai") => void;
}) {
  return (
    <div className="my-3 flex justify-center opacity-0 transition group-hover:opacity-100 hover:opacity-100 has-[button:focus-visible]:opacity-100">
      <div className="flex items-center gap-1 rounded-full bg-neutral-950/90 p-1 text-neutral-200 text-sm shadow-lg ring-1 ring-white/5 backdrop-blur">
        <InsertButton
          disabled={disabled}
          icon={<Plus className="size-3.5" />}
          onClick={() => onAction("blank")}
        >
          Blank scene
        </InsertButton>
        <InsertButton
          disabled={disabled}
          icon={<LayoutTemplate className="size-3.5" />}
          onClick={() => onAction("template")}
        >
          Start with template
        </InsertButton>
        <InsertButton
          disabled={disabled}
          icon={<Wand2 className="size-3.5" />}
          onClick={() => onAction("ai")}
        >
          Generate with AI
        </InsertButton>
      </div>
    </div>
  );
}

function InsertButton({
  icon,
  onClick,
  disabled,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
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
