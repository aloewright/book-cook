import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AloysiusSidecar } from "../components/chat/aloysius-sidecar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { type Chapter, type Section, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/projects/$projectId/chapters/$chapterId")({
  component: ChapterEditorRoute,
});

function ChapterEditorRoute() {
  const { projectId, chapterId } = Route.useParams();
  const chapter = useQuery({
    queryKey: queryKeys.chapter(chapterId),
    queryFn: () => api.getChapter(chapterId),
  });
  const sections = useQuery({
    queryKey: queryKeys.chapterSections(chapterId),
    queryFn: () => api.getChapterSections(chapterId),
  });

  if (chapter.isLoading || !chapter.data) {
    return <p className="px-6 py-12 text-muted-foreground">Loading chapter...</p>;
  }

  return (
    <div className="grid h-[calc(100vh-49px)] min-h-0 grid-cols-[1fr_360px] overflow-hidden">
      <main className="min-w-0 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <Link
                to="/projects/$projectId"
                params={{ projectId }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to workspace
              </Link>
              <h1 className="mt-2 text-2xl font-semibold">
                {chapter.data.ordinal}. {chapter.data.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{chapter.data.summary}</p>
            </div>
            <ChapterStats chapter={chapter.data} />
          </div>

          <ChapterEditor chapter={chapter.data} sections={sections.data?.items ?? []} />
        </div>
      </main>
      <AloysiusSidecar projectId={projectId} />
    </div>
  );
}

function ChapterStats({ chapter }: { chapter: Chapter }) {
  const words = wordCount(chapter.draft_md);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">{chapter.status}</Badge>
      <Badge>
        {words.toLocaleString()} / {chapter.target_words.toLocaleString()} words
      </Badge>
    </div>
  );
}

function ChapterEditor({ chapter, sections }: { chapter: Chapter; sections: Section[] }) {
  return <ChapterEditorInner key={chapter.id} chapter={chapter} sections={sections} />;
}

function ChapterEditorInner({ chapter, sections }: { chapter: Chapter; sections: Section[] }) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedWords, setLastSavedWords] = useState(wordCount(chapter.draft_md));
  const [review, setReview] = useState<{ sectionId: string; before: string; after: string } | null>(
    null,
  );
  const pendingSave = useRef<number | undefined>(undefined);
  const editor = useCreateBlockNote({
    initialContent: initialContent(chapter),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const draftJson = editor.document;
      const draftMd = await editor.blocksToMarkdownLossy(editor.document);
      const words = wordCount(draftMd);
      await api.updateChapter(chapter.id, {
        draft_json: draftJson,
        draft_md: draftMd,
        status: words > 0 ? "drafting" : "pending",
      });
      return words;
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: async (words) => {
      setLastSavedWords(words);
      setSaveState("saved");
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapter(chapter.id) });
    },
    onError: () => setSaveState("error"),
  });

  const draftMutation = useMutation({
    mutationFn: (sectionId: string) => api.draftSection(chapter.id, sectionId),
    onSuccess: async (data) => {
      setReview({
        sectionId: data.section.id,
        before: data.revision.before_md,
        after: data.revision.after_md,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterRevisions(chapter.id) });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, input }: { sectionId: string; input: Partial<Section> }) =>
      api.updateSection(chapter.id, sectionId, {
        status: input.status,
        draft_md: input.draft_md,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.chapterSections(chapter.id) });
    },
  });

  useEffect(() => {
    return () => {
      if (pendingSave.current) window.clearTimeout(pendingSave.current);
    };
  }, []);

  const statusText = useMemo(() => {
    if (saveState === "saving") return "Saving...";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Save failed";
    return "Ready";
  }, [saveState]);

  async function acceptSection(section: Section) {
    const markdown = review?.sectionId === section.id ? review.after : section.draft_md;
    if (!markdown.trim()) return;

    const blocks = await editor.tryParseMarkdownToBlocks(markdown);
    const lastBlock = editor.document.at(-1);
    if (lastBlock) {
      editor.insertBlocks(blocks, lastBlock.id, "after");
    }
    await updateSectionMutation.mutateAsync({
      sectionId: section.id,
      input: { status: "approved" },
    });
    await saveMutation.mutateAsync();
    setReview(null);
  }

  async function rejectSection(section: Section) {
    await updateSectionMutation.mutateAsync({
      sectionId: section.id,
      input: { status: "pending", draft_md: "" },
    });
    if (review?.sectionId === section.id) setReview(null);
  }

  return (
    <div className="space-y-4">
      <SectionDraftPanel
        sections={sections}
        activeSectionId={draftMutation.variables}
        review={review}
        isDrafting={draftMutation.isPending}
        isUpdating={updateSectionMutation.isPending || saveMutation.isPending}
        onDraft={(section) => draftMutation.mutate(section.id)}
        onAccept={acceptSection}
        onReject={rejectSection}
      />

      <section className="rounded-lg border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{statusText}</span>
            <span aria-hidden>·</span>
            <span>{lastSavedWords.toLocaleString()} saved words</span>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => saveMutation.mutate()}>
            Save now
          </Button>
        </div>
        <div className="min-h-[560px] px-4 py-5" data-testid="chapter-editor">
          <BlockNoteView
            editor={editor}
            theme="light"
            onChange={() => {
              if (pendingSave.current) window.clearTimeout(pendingSave.current);
              pendingSave.current = window.setTimeout(() => saveMutation.mutate(), 1000);
            }}
          />
        </div>
      </section>
    </div>
  );
}

function SectionDraftPanel({
  sections,
  activeSectionId,
  review,
  isDrafting,
  isUpdating,
  onDraft,
  onAccept,
  onReject,
}: {
  sections: Section[];
  activeSectionId?: string;
  review: { sectionId: string; before: string; after: string } | null;
  isDrafting: boolean;
  isUpdating: boolean;
  onDraft: (section: Section) => void;
  onAccept: (section: Section) => void;
  onReject: (section: Section) => void;
}) {
  if (sections.length === 0) return null;

  return (
    <section className="rounded-lg border bg-background" aria-label="Section drafts">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Section drafts</h2>
      </div>
      <div className="divide-y">
        {sections.map((section) => {
          const activeReview = review?.sectionId === section.id ? review : null;
          const generated = activeReview?.after ?? section.draft_md;
          const busy = (isDrafting && activeSectionId === section.id) || isUpdating;
          return (
            <div key={section.id} className="space-y-3 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{section.ordinal}</Badge>
                    <h3 className="text-sm font-medium">{titleCase(section.kind)}</h3>
                    <Badge>{section.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{section.prompt}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onDraft(section)}
                >
                  <Wand2 className="h-4 w-4" />
                  {busy ? "Drafting..." : generated ? "Redraft" : "Draft section"}
                </Button>
              </div>

              {generated && (
                <div className="rounded-md border bg-muted/30 p-3" data-testid="section-diff">
                  <DiffPreview before={activeReview?.before ?? ""} after={generated} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => onAccept(section)}
                    >
                      <Check className="h-4 w-4" />
                      Accept into chapter
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onReject(section)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DiffPreview({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Before</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">
          {before.trim() || "No prior draft."}
        </pre>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Generated</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">
          {after}
        </pre>
      </div>
    </div>
  );
}

function initialContent(chapter: Chapter) {
  if (Array.isArray(chapter.draft_json)) return chapter.draft_json;
  if (chapter.draft_md.trim()) {
    return [
      {
        type: "paragraph",
        content: chapter.draft_md,
      },
    ];
  }
  return [
    {
      type: "heading",
      props: { level: 2 },
      content: chapter.title,
    },
    {
      type: "paragraph",
      content: "",
    },
  ];
}

function wordCount(text: string) {
  return text.trim().match(/\b[\w'-]+\b/g)?.length ?? 0;
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
