import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, FileText, LibraryBig, Pencil } from "lucide-react";
import { type ReactNode, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useGsapTimeline } from "../components/animation/use-gsap-timeline";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { type ExportKind, type RenderJob, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/projects/$projectId/book")({ component: FullBookPage });

function FullBookPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const book = useQuery({
    queryKey: queryKeys.fullBook(projectId),
    queryFn: () => api.getFullBook(projectId),
  });
  const jobs = useQuery({
    queryKey: queryKeys.renderJobs(projectId),
    queryFn: () => api.listRenderJobs(projectId),
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => job.status === "queued" || job.status === "running")
        ? 3_000
        : false,
  });
  const startExport = useMutation({
    mutationFn: (format: ExportKind) => api.startBookExport(projectId, { formats: [format] }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.renderJobs(projectId) });
    },
  });

  if (book.isLoading || !book.data) {
    return <p className="px-6 py-12 text-muted-foreground">Loading full book...</p>;
  }

  const { project, book: manuscript } = book.data;
  const exportableJobs = (jobs.data?.items ?? []).filter(
    (job) => job.kind === "pdf" || job.kind === "epub",
  );

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-3">
            <Link to="/projects/$projectId" params={{ projectId }}>
              Back to workspace
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">Full book</h1>
            <Badge variant="secondary">{project.title}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review the assembled manuscript from drafted chapters, then export the full book as PDF
            or EPUB.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportMotionButton
            icon={<FileText className="h-4 w-4" />}
            label="Export PDF"
            pendingLabel="Exporting..."
            pending={startExport.isPending && startExport.variables === "pdf"}
            disabled={startExport.isPending || manuscript.chapters.length === 0}
            onClick={() => startExport.mutate("pdf")}
          />
          <ExportMotionButton
            icon={<Download className="h-4 w-4" />}
            label="Export EPUB"
            pendingLabel="Exporting..."
            pending={startExport.isPending && startExport.variables === "epub"}
            disabled={startExport.isPending || manuscript.chapters.length === 0}
            variant="secondary"
            onClick={() => startExport.mutate("epub")}
          />
        </div>
      </div>

      {startExport.error ? (
        <p className="text-sm text-destructive">{startExport.error.message}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-4 shadow-none">
            <div className="flex items-center gap-2">
              <LibraryBig className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Book status</h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Chapters</dt>
                <dd className="font-medium">
                  {manuscript.drafted_chapters} drafted / {manuscript.chapters.length} planned
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Words</dt>
                <dd className="font-medium">{manuscript.total_words.toLocaleString()}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4 shadow-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Export readiness</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <ReadinessRow
                label="Drafted chapters"
                ready={manuscript.drafted_chapters === manuscript.chapters.length}
              />
              <ReadinessRow label="PDF export" ready={manuscript.chapters.length > 0} />
              <ReadinessRow label="EPUB export" ready={manuscript.chapters.length > 0} />
            </div>
          </Card>

          {manuscript.chapters.length ? (
            <Card className="p-4 shadow-none">
              <h2 className="text-sm font-semibold">Chapters</h2>
              <nav className="mt-3 grid gap-1">
                {manuscript.chapters.map((chapter) => (
                  <a
                    key={chapter.ordinal}
                    href={`#chapter-${chapter.ordinal}`}
                    className="truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {chapter.ordinal}. {chapter.title}
                  </a>
                ))}
              </nav>
            </Card>
          ) : null}

          <Card className="p-4 shadow-none">
            <h2 className="text-sm font-semibold">Downloads</h2>
            <RenderJobsList jobs={exportableJobs} />
          </Card>
        </aside>

        {manuscript.chapters.length ? (
          <article className="min-w-0 rounded-lg border bg-background px-6 py-8 sm:px-10">
            <header className="border-b pb-8 text-center">
              <p className="text-sm font-semibold uppercase text-muted-foreground">Manuscript</p>
              <h2 className="mt-3 text-4xl font-semibold">{manuscript.title}</h2>
            </header>
            <div className="mt-8 space-y-10">
              {manuscript.chapters.map((chapter) => (
                <section
                  key={chapter.ordinal}
                  id={`chapter-${chapter.ordinal}`}
                  className="scroll-mt-8"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                    <h3 className="text-2xl font-semibold">
                      {chapter.ordinal}. {chapter.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={chapter.has_draft ? "default" : "secondary"}>
                        {chapter.has_draft ? "Draft" : "Summary"}
                      </Badge>
                      <Badge variant="outline">{chapter.word_count.toLocaleString()} words</Badge>
                      {chapter.id ? (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/projects/$projectId/chapters/$chapterId"
                            params={{ projectId, chapterId: chapter.id }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="prose prose-neutral max-w-none dark:prose-invert">
                    <ReactMarkdown>{chapter.body_md}</ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>
          </article>
        ) : (
          <Card className="border-dashed p-8 text-center text-muted-foreground shadow-none">
            Generate an outline before viewing the full book.
          </Card>
        )}
      </div>
    </section>
  );
}

function ExportMotionButton({
  icon,
  label,
  pendingLabel,
  pending,
  disabled,
  onClick,
  variant,
}: {
  icon: ReactNode;
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: "secondary";
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  useGsapTimeline(
    ref,
    (timeline, node) => {
      timeline.to(node, { scale: pending ? 0.98 : 1, repeat: pending ? 1 : 0, yoyo: true });
    },
    [pending],
  );

  return (
    <Button ref={ref} type="button" variant={variant} disabled={disabled} onClick={onClick}>
      {icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ReadinessRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={ready ? "default" : "secondary"}>{ready ? "Ready" : "Open"}</Badge>
    </div>
  );
}

function RenderJobsList({ jobs }: { jobs: RenderJob[] }) {
  if (!jobs.length) {
    return <p className="mt-3 text-sm text-muted-foreground">No PDF or EPUB exports yet.</p>;
  }
  return (
    <div className="mt-3 divide-y rounded-md border">
      {jobs.slice(0, 6).map((job) => (
        <div key={job.id} className="grid gap-2 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium uppercase">{job.kind}</span>
            <span
              className={job.status === "failed" ? "text-destructive" : "text-muted-foreground"}
            >
              {job.status}
            </span>
          </div>
          {job.error ? <p className="text-destructive">{job.error}</p> : null}
          {job.download_url ? (
            <Button asChild size="sm" variant="outline">
              <a href={job.download_url}>Download {job.kind.toUpperCase()}</a>
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
