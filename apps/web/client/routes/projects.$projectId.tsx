import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AloysiusSidecar } from "../components/chat/aloysius-sidecar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { OutlineRail } from "../components/workspace/outline-rail";
import { TopBar } from "../components/workspace/top-bar";
import { type Project, type Voice, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectWorkspace });

const POSTPILOT_SUGGESTIONS = [
  { slug: "dickens", label: "Dickens" },
  { slug: "austen", label: "Austen" },
  { slug: "twain", label: "Twain" },
  { slug: "hemingway", label: "Hemingway" },
] as const;

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  if (location.pathname.includes("/chapters/")) {
    return <Outlet />;
  }

  if (project.isLoading || !project.data) {
    return <p className="px-6 py-12 text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col overflow-hidden">
      <TopBar project={project.data} />
      <div className="grid min-h-0 flex-1 grid-cols-[200px_1fr_360px]">
        <OutlineRail active="voice" />
        <main className="overflow-y-auto px-6 py-12">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
            <VoicePanel project={project.data} />
            <OutlineBuilder project={project.data} />
          </div>
        </main>
        <AloysiusSidecar projectId={projectId} />
      </div>
    </div>
  );
}

function VoicePanel({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [sample, setSample] = useState("");
  const [newSample, setNewSample] = useState("");
  const [postPilotSlug, setPostPilotSlug] = useState("dickens");
  const [selectedVoiceId, setSelectedVoiceId] = useState(project.voice_id ?? "");
  const voices = useQuery({
    queryKey: queryKeys.voices(),
    queryFn: api.listVoices,
  });
  const selectedVoice = useQuery({
    queryKey: queryKeys.voice(selectedVoiceId),
    queryFn: () => api.getVoice(selectedVoiceId),
    enabled: Boolean(selectedVoiceId),
  });

  const selected = selectedVoice.data;
  const totalWords = useMemo(
    () => selected?.samples?.reduce((sum, item) => sum + item.word_count, 0) ?? 0,
    [selected],
  );

  const createVoice = useMutation({
    mutationFn: () =>
      api.createVoice({
        name,
        samples: sample.trim() ? [{ source: "paste", text: sample }] : [],
      }),
    onSuccess: async ({ id }) => {
      setName("");
      setSample("");
      setSelectedVoiceId(id);
      await api.updateProject(project.id, { voice_id: id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.voices() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
      ]);
    },
  });

  const assignVoice = useMutation({
    mutationFn: (voiceId: string) => api.updateProject(project.id, { voice_id: voiceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
  });

  const importPostPilot = useMutation({
    mutationFn: () => api.importPostPilotVoice({ slug: postPilotSlug }),
    onSuccess: async ({ id }) => {
      setSelectedVoiceId(id);
      await api.updateProject(project.id, { voice_id: id });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.voices() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
      ]);
    },
  });

  const addSample = useMutation({
    mutationFn: () => api.addVoiceSample(selectedVoiceId, { source: "paste", text: newSample }),
    onSuccess: async () => {
      setNewSample("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.voice(selectedVoiceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.voices() }),
      ]);
    },
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Voice library</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Build reusable author voices from pasted samples. Architect and Writer use the
              selected voice for outline and draft generation.
            </p>
          </div>
          {project.voice_id ? (
            <Badge>Voice selected</Badge>
          ) : (
            <Badge variant="secondary">No voice</Badge>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form
          className="rounded-lg border bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            createVoice.mutate();
          }}
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Create custom voice</h2>
            <p className="text-sm text-muted-foreground">
              Paste at least 1,500 words for distillation.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Voice name"
              required
            />
            <Textarea
              value={sample}
              onChange={(event) => setSample(event.target.value)}
              placeholder="Paste sample text"
              className="min-h-56 resize-y"
            />
            <Button type="submit" disabled={!name.trim() || createVoice.isPending}>
              {createVoice.isPending ? "Creating..." : "Create voice"}
            </Button>
            {createVoice.error ? (
              <p className="text-sm text-destructive">{createVoice.error.message}</p>
            ) : null}
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Import from Post Pilot</h2>
              <p className="text-sm text-muted-foreground">
                Clone a public-domain style guide into your local voice library.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select value={postPilotSlug} onValueChange={setPostPilotSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a guide" />
                </SelectTrigger>
                <SelectContent>
                  {POSTPILOT_SUGGESTIONS.map((item) => (
                    <SelectItem key={item.slug} value={item.slug}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={importPostPilot.isPending}
                onClick={() => importPostPilot.mutate()}
              >
                {importPostPilot.isPending ? "Importing..." : "Import"}
              </Button>
            </div>
            <Input
              value={postPilotSlug}
              onChange={(event) => setPostPilotSlug(event.target.value)}
              placeholder="custom-slug"
              className="mt-3"
            />
            {importPostPilot.error ? (
              <p className="mt-3 text-sm text-destructive">{importPostPilot.error.message}</p>
            ) : null}
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Project voice</h2>
              <p className="text-sm text-muted-foreground">
                Choose the voice attached to this book.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <Select
                value={selectedVoiceId}
                onValueChange={(value) => {
                  setSelectedVoiceId(value);
                  assignVoice.mutate(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {(voices.data?.items ?? []).map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <VoiceProfile voice={selected} totalWords={totalWords} />
          {selected ? (
            <form
              className="rounded-lg border bg-background p-4"
              onSubmit={(event) => {
                event.preventDefault();
                addSample.mutate();
              }}
            >
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Add sample</h2>
                <p className="text-sm text-muted-foreground">
                  Add more corpus text to improve the profile.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <Textarea
                  value={newSample}
                  onChange={(event) => setNewSample(event.target.value)}
                  placeholder="Paste another sample"
                  className="min-h-32 resize-y"
                />
                <Button type="submit" disabled={!newSample.trim() || addSample.isPending}>
                  {addSample.isPending ? "Adding..." : "Add sample"}
                </Button>
                {addSample.error ? (
                  <p className="text-sm text-destructive">{addSample.error.message}</p>
                ) : null}
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function OutlineBuilder({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [framework, setFramework] = useState(project.type === "fiction" ? "hero-journey" : "paas");
  const [questionnaire, setQuestionnaire] = useState("");
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(project.id),
    queryFn: () => api.getProjectOutline(project.id),
  });
  const generate = useMutation({
    mutationFn: () => api.generateProjectOutline(project.id, { framework, questionnaire }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectOutline(project.id) }),
      ]),
  });

  return (
    <section className="border-t pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Outline builder</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pick a framework, answer the architect prompt, and generate chapter skeletons for
            drafting.
          </p>
        </div>
        {outline.data?.outline ? (
          <Badge>Outline v{outline.data.outline.version}</Badge>
        ) : (
          <Badge variant="secondary">No outline</Badge>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form
          className="rounded-lg border bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            generate.mutate();
          }}
        >
          <div className="space-y-3">
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger>
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                {project.type === "fiction" ? (
                  <SelectItem value="hero-journey">Hero's Journey</SelectItem>
                ) : (
                  <SelectItem value="paas">Problem to Agitate to Solve</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Textarea
              value={questionnaire}
              onChange={(event) => setQuestionnaire(event.target.value)}
              placeholder="Reader, promise, proof, constraints, must-include stories..."
              className="min-h-52 resize-y"
              required
            />
            <Button type="submit" disabled={!questionnaire.trim() || generate.isPending}>
              {generate.isPending ? "Generating..." : "Generate outline"}
            </Button>
            {generate.error ? (
              <p className="text-sm text-destructive">{generate.error.message}</p>
            ) : null}
          </div>
        </form>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Chapter skeletons</h2>
            <span className="text-sm text-muted-foreground">
              {outline.data?.chapters.length ?? 0} chapters
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {(outline.data?.chapters ?? []).length ? (
              outline.data?.chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  to="/projects/$projectId/chapters/$chapterId"
                  params={{ projectId: project.id, chapterId: chapter.id }}
                  className="block rounded-md border bg-muted/20 p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">
                      {chapter.ordinal}. {chapter.title}
                    </h3>
                    <Badge variant="secondary">{chapter.target_words.toLocaleString()} words</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{chapter.summary}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Generated chapters will appear here after the first outline run.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function VoiceProfile({ voice, totalWords }: { voice?: Voice; totalWords: number }) {
  if (!voice) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
        Create or select a voice to see its profile and sample corpus.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{voice.name}</h2>
          <p className="text-sm text-muted-foreground">
            {voice.samples?.length ?? 0} samples, {totalWords.toLocaleString()} words
          </p>
        </div>
        <Badge variant={totalWords >= 1500 ? "default" : "secondary"}>
          {totalWords >= 1500 ? "Distilled" : "Needs more sample"}
        </Badge>
      </div>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm leading-6">
        {voice.profile_md || "No profile yet."}
      </pre>
    </div>
  );
}
