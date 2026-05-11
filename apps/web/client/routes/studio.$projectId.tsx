import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { GripVertical, Plus, Settings2, Sparkles, SquarePen, Type, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssistantPanel } from "../components/studio/AssistantPanel";
import { BreadcrumbPill } from "../components/studio/BreadcrumbPill";
import { SideDrawer } from "../components/studio/SideDrawer";
import { TopLeftPill } from "../components/studio/TopLeftPill";
import { type Chapter, type Section, api, queryKeys } from "../lib/api";
import { useDrawerLayout } from "../lib/drawer-layout";

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
  const queryClient = useQueryClient();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(projectId),
    queryFn: () => api.getProjectOutline(projectId),
  });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [remixMessage, setRemixMessage] = useState<string | null>(null);
  const drawer = useDrawerLayout();

  const chapters = outline.data?.chapters ?? [];
  const lastChapter = chapters[chapters.length - 1];
  const firstChapter = chapters[0];

  const lastChapterSections = useQuery({
    queryKey: queryKeys.chapterSections(lastChapter?.id ?? ""),
    queryFn: () => {
      if (!lastChapter) throw new Error("No chapters yet.");
      return api.getChapterSections(lastChapter.id);
    },
    enabled: !!lastChapter,
  });
  const lastSection = lastChapterSections.data?.items.at(-1);

  const globalInsert = useMutation({
    mutationFn: async () => {
      if (!lastChapter) throw new Error("No chapters yet.");
      if (!lastSection) throw new Error("No sections in last chapter.");
      return api.draftSection(lastChapter.id, lastSection.id, {
        instruction: TEMPLATE_INSTRUCTION,
      });
    },
    onSuccess: async () => {
      if (!lastChapter) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chapterSections(lastChapter.id),
      });
      setRemixMessage("Drafted.");
    },
    onError: (err: Error) => setRemixMessage(err.message),
  });

  const globalRemix = useMutation({
    mutationFn: async () => {
      const sel = window.getSelection()?.toString().trim() ?? "";
      if (!sel) throw new Error("Select text first.");
      if (!firstChapter) throw new Error("No chapters yet.");
      return api.reviseChapterSelection(firstChapter.id, {
        action: "rewrite",
        text: sel,
      });
    },
    onSuccess: () => setRemixMessage("Remix saved."),
    onError: (err: Error) => setRemixMessage(err.message),
  });

  useEffect(() => {
    if (!remixMessage) return;
    const id = window.setTimeout(() => setRemixMessage(null), 3000);
    return () => window.clearTimeout(id);
  }, [remixMessage]);

  if (location.pathname !== `/studio/${projectId}`) {
    return <Outlet />;
  }

  const title = project.data?.title ?? "Untitled book";
  const insertDisabled = !lastChapter || !lastSection || globalInsert.isPending;
  const remixDisabled = !firstChapter || globalRemix.isPending;

  return (
    <div className="relative min-h-screen bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100">
      <SideDrawer projectId={projectId} current="canvas" />
      <TopLeftPill />
      <BreadcrumbPill title={title} />

      <main
        className={`flex flex-col items-center gap-6 px-6 pt-28 pb-40 transition-[padding] ${
          drawer.open ? (drawer.collapsed ? "lg:pl-[5rem]" : "lg:pl-[19rem]") : ""
        } ${assistantOpen ? "lg:pr-[19rem]" : ""}`}
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

        {chapters.length > 0 && (
          <div className="w-full max-w-3xl">
            <span className="rounded-full bg-neutral-950/90 px-3 py-1 text-[11px] text-neutral-400 ring-1 ring-white/5 backdrop-blur">
              {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {chapters.map((chapter) => (
          <ChapterCanvas key={chapter.id} chapter={chapter} projectId={projectId} />
        ))}
      </main>

      <BottomToolbar
        assistantOpen={assistantOpen}
        insertDisabled={insertDisabled}
        onInsert={() => globalInsert.mutate()}
        onRemix={() => globalRemix.mutate()}
        onToggleAssistant={() => setAssistantOpen((v) => !v)}
        projectId={projectId}
        remixDisabled={remixDisabled}
        remixMessage={remixMessage}
      />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}

function ChapterCanvas({
  chapter,
  projectId,
}: {
  chapter: Chapter;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const sectionsQ = useQuery({
    queryKey: queryKeys.chapterSections(chapter.id),
    queryFn: () => api.getChapterSections(chapter.id),
  });
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [chapterDropOver, setChapterDropOver] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => api.createSection(chapter.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) }),
  });

  const items = sectionsQ.data?.items ?? [];

  function handleDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault();
    setDragOverSectionId(sectionId);
    setChapterDropOver(false);
  }

  function handleChapterDragOver(e: React.DragEvent) {
    e.preventDefault();
    setChapterDropOver(true);
    setDragOverSectionId(null);
  }

  async function handleDrop(e: React.DragEvent, targetSectionId: string | null) {
    e.preventDefault();
    setDragOverSectionId(null);
    setChapterDropOver(false);
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    const { sectionId, fromChapterId } = JSON.parse(raw) as {
      sectionId: string;
      fromChapterId: string;
    };

    if (fromChapterId !== chapter.id) {
      await api.moveSectionToChapter(fromChapterId, sectionId, chapter.id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chapterSections(fromChapterId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
      return;
    }

    // Same chapter — reorder
    const current = [...items];
    const fromIdx = current.findIndex((s) => s.id === sectionId);
    const toIdx = targetSectionId
      ? current.findIndex((s) => s.id === targetSectionId)
      : current.length - 1;
    if (fromIdx === -1 || fromIdx === toIdx) return;
    const reordered = [...current];
    const [moved] = reordered.splice(fromIdx, 1);
    if (!moved) return;
    reordered.splice(toIdx, 0, moved);
    const ordinals = reordered.map((s, i) => ({ id: s.id, ordinal: i + 1 }));
    await api.reorderSections(chapter.id, ordinals);
    await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
  }

  return (
    <div
      className={`flex w-full max-w-3xl flex-col gap-2 rounded-2xl p-4 transition ${
        chapterDropOver ? "ring-2 ring-emerald-500/40" : ""
      }`}
      onDragOver={handleChapterDragOver}
      onDragLeave={() => setChapterDropOver(false)}
      onDrop={(e) => handleDrop(e, null)}
    >
      <ChapterHeading chapter={chapter} projectId={projectId} />
      {sectionsQ.isLoading ? (
        <p className="py-2 font-serif text-neutral-500 text-sm">Loading…</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((section, i) => (
            <SceneSummaryCard
              key={section.id}
              section={section}
              chapterId={chapter.id}
              projectId={projectId}
              index={i + 1}
              isDragOver={dragOverSectionId === section.id}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDrop={(e) => handleDrop(e, section.id)}
            />
          ))}
          <button
            className="mt-1 flex items-center gap-1.5 self-start rounded-full bg-neutral-950/80 px-3 py-1.5 text-[11px] text-neutral-400 ring-1 ring-white/5 backdrop-blur transition hover:text-neutral-200 disabled:opacity-50"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            type="button"
          >
            <Plus className="size-3" />
            Add scene
          </button>
        </div>
      )}
    </div>
  );
}

function SceneSummaryCard({
  section,
  chapterId,
  projectId,
  index,
  isDragOver,
  onDragOver,
  onDrop,
}: {
  section: Section;
  chapterId: string;
  projectId: string;
  index: number;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(section.prompt);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!editing) setSummary(section.prompt);
  }, [section.prompt, editing]);

  function scheduleSave(next: string) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      api.updateSection(chapterId, section.id, { prompt: next });
    }, 800);
  }

  return (
    <div
      className={`group flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 ring-1 transition dark:bg-neutral-900/70 ${
        isDragOver ? "ring-emerald-500/50" : "ring-black/5 dark:ring-white/5"
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({ sectionId: section.id, fromChapterId: chapterId }),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {}}
    >
      <GripVertical className="size-3.5 shrink-0 cursor-grab text-neutral-400 active:cursor-grabbing" />
      <span className="w-14 shrink-0 text-[10px] text-neutral-400 uppercase tracking-wide">
        Scene {index}
      </span>
      {editing ? (
        <input
          className="min-w-0 flex-1 bg-transparent font-serif text-sm outline-none placeholder:text-neutral-400"
          ref={(el) => el?.focus()}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setSummary(e.target.value);
            scheduleSave(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          placeholder="Scene summary…"
          value={summary}
        />
      ) : (
        <button
          className="min-w-0 flex-1 truncate text-left font-serif text-sm text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
          onClick={() => setEditing(true)}
          type="button"
        >
          {summary || <span className="text-neutral-400 italic">No summary yet</span>}
        </button>
      )}
      <Link
        className="shrink-0 rounded-md px-2 py-1 text-[10px] text-neutral-400 opacity-0 ring-1 ring-transparent transition hover:bg-white/10 hover:text-neutral-200 hover:ring-white/10 group-hover:opacity-100"
        params={{ projectId, chapterId }}
        to="/studio/$projectId/chapters/$chapterId"
      >
        Open →
      </Link>
    </div>
  );
}

function ChapterHeading({ chapter, projectId }: { chapter: Chapter; projectId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(chapter.title);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSaved = useRef(chapter.title);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (title === lastSaved.current && chapter.title !== lastSaved.current) {
      lastSaved.current = chapter.title;
      setTitle(chapter.title);
    }
  }, [chapter.title, title]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function handleChange(next: string) {
    setTitle(next);
    if (timer.current) window.clearTimeout(timer.current);
    if (next.trim() === lastSaved.current) {
      setSaving("idle");
      return;
    }
    setSaving("saving");
    timer.current = window.setTimeout(async () => {
      try {
        await api.updateChapter(chapter.id, { title: next.trim() });
        lastSaved.current = next.trim();
        setSaving("saved");
        queryClient.invalidateQueries({ queryKey: queryKeys.projectOutline(projectId) });
      } catch {
        setSaving("error");
      }
    }, 800);
  }

  return (
    <div className="px-1">
      <div className="flex items-center gap-2">
        <div className="text-[11px] text-neutral-500 uppercase tracking-wide">
          Chapter {chapter.ordinal}
        </div>
        {saving === "saving" && <span className="text-[11px] text-neutral-500">Saving…</span>}
        {saving === "saved" && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Saved</span>
        )}
        {saving === "error" && <span className="text-[11px] text-red-500">Save failed</span>}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          aria-label="Chapter title"
          className="min-w-0 flex-1 bg-transparent font-serif text-2xl tracking-tight outline-none placeholder:text-neutral-400 focus:bg-black/5 focus:px-1 focus:-mx-1 focus:rounded dark:focus:bg-white/5"
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Untitled chapter"
          value={title}
        />
        <Link
          aria-label="Open chapter editor"
          className="grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-neutral-100"
          params={{ projectId, chapterId: chapter.id }}
          title="Open chapter editor"
          to="/studio/$projectId/chapters/$chapterId"
        >
          <SquarePen className="size-4" />
        </Link>
      </div>
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
        to="/studio/$projectId/outline"
      >
        <Wand2 className="size-3.5" />
        Generate outline
      </Link>
    </div>
  );
}

function BottomToolbar({
  projectId,
  onInsert,
  onRemix,
  onToggleAssistant,
  insertDisabled,
  remixDisabled,
  remixMessage,
  assistantOpen,
}: {
  projectId: string;
  onInsert: () => void;
  onRemix: () => void;
  onToggleAssistant: () => void;
  insertDisabled: boolean;
  remixDisabled: boolean;
  remixMessage: string | null;
  assistantOpen: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="-translate-x-1/2 fixed bottom-6 left-1/2 z-20"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`relative flex h-10 items-center overflow-hidden rounded-full bg-neutral-950/90 text-neutral-200 shadow-2xl ring-1 ring-white/5 backdrop-blur transition-[max-width] duration-500 ${
          expanded ? "max-w-[440px]" : "max-w-10"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* Collapsed: centered icon */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            expanded ? "opacity-0" : "opacity-100"
          }`}
        >
          <Settings2 className="size-4" />
        </div>

        {/* Expanded: full toolbar */}
        <div
          className={`flex shrink-0 items-center gap-1 px-1 whitespace-nowrap transition-opacity duration-300 ${
            expanded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ transitionDelay: expanded ? "150ms" : "0ms" }}
        >
          <PillButton
            disabled={insertDisabled}
            icon={<Plus className="size-4" />}
            onClick={onInsert}
          >
            Insert
          </PillButton>
          <PillButton
            disabled={remixDisabled}
            icon={<Wand2 className="size-4" />}
            onClick={onRemix}
          >
            Remix
          </PillButton>
          <Link
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-white/10"
            params={{ projectId }}
            to="/studio/$projectId/voice"
          >
            <Type className="size-4" /> Voice
          </Link>
          {remixMessage ? (
            <span className="px-3 py-1.5 text-[11px] text-emerald-300">{remixMessage}</span>
          ) : null}
          <button
            aria-label={assistantOpen ? "Close assistant" : "Open assistant"}
            className={`grid size-8 place-items-center rounded-full transition hover:bg-white/10 ${
              assistantOpen ? "bg-emerald-600/20 text-emerald-400" : ""
            }`}
            onClick={onToggleAssistant}
            type="button"
          >
            <Sparkles className="size-4" />
          </button>
        </div>
      </div>
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
