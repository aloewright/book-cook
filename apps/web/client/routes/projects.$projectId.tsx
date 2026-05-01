import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
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
import {
  type NarrationApproval,
  type NarrationAudition,
  type Project,
  type PublisherPack,
  type RenderJob,
  type ScoutResult,
  type Voice,
  api,
  queryKeys,
} from "../lib/api";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectWorkspace });

const POSTPILOT_SUGGESTIONS = [
  { slug: "dickens", label: "Dickens" },
  { slug: "austen", label: "Austen" },
  { slug: "twain", label: "Twain" },
  { slug: "hemingway", label: "Hemingway" },
] as const;

const FIELD_SLOT_IDS = ["one", "two", "three", "four", "five", "six", "seven"] as const;
const CHARACTER_SLOT_IDS = [
  "char-one",
  "char-two",
  "char-three",
  "char-four",
  "char-five",
] as const;

const CHARACTER_ARC_OPTIONS = [
  { value: "positive-change", label: "Positive Change" },
  { value: "flat", label: "Flat" },
  { value: "disillusionment", label: "Disillusionment" },
  { value: "fall", label: "Fall" },
  { value: "corruption", label: "Corruption" },
  { value: "redemption", label: "Redemption" },
  { value: "static-foil", label: "Static / Foil" },
] as const;

type CharacterArcDraft = {
  id: string;
  name: string;
  arc: string;
  position: string;
  sceneRole: string;
};

const OUTLINE_FRAMEWORKS = [
  {
    id: "paas",
    type: "nonfiction",
    label: "Problem -> Agitate -> Solve",
    description: "Direct nonfiction argument for promise-led practical books.",
    questions: [
      "What painful problem does the reader want solved?",
      "What has the reader already tried?",
      "What promise can this book credibly make?",
      "What proof, stories, or examples can support the method?",
    ],
  },
  {
    id: "reader-transformation",
    type: "nonfiction",
    label: "Reader Transformation",
    description: "Nonfiction arc from current state to changed behavior.",
    questions: [
      "What is the reader's current state?",
      "What transformation should the book deliver?",
      "What method, proof, or case studies support the promise?",
      "What should the reader do differently after each chapter?",
    ],
  },
  {
    id: "hero-journey",
    type: "fiction",
    label: "Hero's Journey",
    description: "Classic quest structure for adventure-forward fiction.",
    questions: [
      "Who is the protagonist and what do they want?",
      "What wound or false belief keeps them stuck?",
      "What forces them out of the ordinary world?",
      "What choice proves they have changed?",
    ],
  },
  {
    id: "truby-22",
    type: "fiction",
    label: "Truby-style 22 Beats",
    description: "Dense cause-and-effect story architecture with moral pressure.",
    questions: [
      "What does the protagonist want on the surface?",
      "What deeper need or weakness must the plot expose?",
      "Who is the opponent and why are they morally persuasive?",
      "What final choice proves the protagonist has changed?",
    ],
  },
  {
    id: "character-arc",
    type: "fiction",
    label: "Character Arc",
    description: "K.M. Weiland-style want, need, lie, truth, and climactic choice.",
    questions: [
      "What lie or false belief drives the protagonist?",
      "What external want keeps them moving?",
      "What truth would make them whole?",
      "What pressure forces them to choose between the lie and the truth?",
    ],
  },
  {
    id: "thriller",
    type: "fiction",
    label: "Thriller Escalation",
    description: "Suspense-first outline with reversals, traps, and cliffhangers.",
    questions: [
      "What danger opens the book before anyone fully understands it?",
      "What personal stakes make retreat impossible?",
      "What does the antagonist know that the protagonist does not?",
      "What reversal changes the meaning of the investigation?",
    ],
  },
  {
    id: "sci-fi",
    type: "fiction",
    label: "Sci-Fi World + Idea",
    description: "Speculative premise, world rules, human cost, and ethical choice.",
    questions: [
      "What speculative premise changes ordinary life?",
      "What rule makes the world feel consistent?",
      "What human conflict keeps the idea emotional?",
      "What ethical choice should the ending force?",
    ],
  },
] as const;

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  if (location.pathname.includes("/chapters/") || location.pathname.includes("/launch")) {
    return <Outlet />;
  }

  if (project.isLoading || !project.data) {
    return <p className="px-6 py-12 text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-project-workspace>
      <TopBar project={project.data} />
      <div className="grid min-h-0 flex-1 grid-cols-[200px_1fr_360px] overflow-hidden">
        <OutlineRail active="concept" />
        <main className="overflow-y-auto px-6 py-12">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
            <ConceptScoutPanel project={project.data} />
            <VoicePanel project={project.data} />
            <OutlineBuilder project={project.data} />
            <PublishPanel project={project.data} />
          </div>
        </main>
        <AloysiusSidecar projectId={projectId} />
      </div>
    </div>
  );
}

function ConceptScoutPanel({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [niche, setNiche] = useState(project.title);
  const findings = useQuery({
    queryKey: queryKeys.projectScoutFindings(project.id),
    queryFn: () => api.listProjectScoutFindings(project.id),
  });
  const pull = useMutation({
    mutationFn: () =>
      api.createScoutQuery({
        niche,
        type: project.type,
        project_id: project.id,
        params: { source: "project-concept" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectScoutFindings(project.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.scoutQueries() }),
      ]);
    },
  });
  const latest = findings.data?.items[0] ?? null;

  return (
    <section id="concept" className="scroll-mt-6 border-b pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Concept</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Attach market evidence to this book before voice, outline, and publishing work.
          </p>
        </div>
        {latest ? <Badge>Scout pulled</Badge> : <Badge variant="secondary">No Scout read</Badge>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form
          className="rounded-lg border bg-background p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (niche.trim()) pull.mutate();
          }}
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Pull from Scout</h2>
            <p className="text-sm text-muted-foreground">
              Run the current concept against the market dataset and save the finding to this
              project.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            <Input
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              placeholder="Niche or reader demand"
            />
            <Button type="submit" disabled={!niche.trim() || pull.isPending}>
              <Search className="h-4 w-4" />
              {pull.isPending ? "Pulling..." : "Pull from Scout"}
            </Button>
            {pull.error ? <p className="text-sm text-destructive">{pull.error.message}</p> : null}
          </div>
        </form>

        <ProjectScoutFinding result={latest} loading={findings.isLoading} />
      </div>
    </section>
  );
}

function ProjectScoutFinding({
  result,
  loading,
}: {
  result: ScoutResult | null;
  loading: boolean;
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
        {loading ? "Loading Scout findings..." : "Pull a Scout read to show evidence here."}
      </div>
    );
  }

  const evidence = result.finding.evidence_json;
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{result.query.niche}</h2>
          <p className="text-sm text-muted-foreground">
            {evidence.dataset.week_iso} · {evidence.records.length} evidence rows
          </p>
        </div>
        <Badge variant="secondary">{result.query.type}</Badge>
      </div>
      <div className="mt-4 grid gap-3">
        {evidence.gaps.slice(0, 3).map((gap) => (
          <div key={gap} className="rounded-md bg-muted/40 p-3 text-sm">
            {gap}
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-md border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-2 py-2">Rank</th>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {evidence.records.slice(0, 4).map((record) => (
              <tr key={`${record.source}-${record.rank}-${record.title}`} className="border-t">
                <td className="px-2 py-2 font-medium">{record.rank}</td>
                <td className="px-2 py-2">{record.title}</td>
                <td className="px-2 py-2 text-muted-foreground">{record.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div id="voice" className="flex w-full scroll-mt-6 flex-col gap-8">
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
  const [characters, setCharacters] = useState<CharacterArcDraft[]>([
    {
      id: CHARACTER_SLOT_IDS[0],
      name: "",
      arc: "positive-change",
      position: "",
      sceneRole: "",
    },
  ]);
  const [defaultCast, setDefaultCast] = useState("");
  const [miniStructure, setMiniStructure] = useState(
    "Setup: scene goal, cast, and conflict. Turn: force a reversal, reveal, or choice. Fallout: end with a consequence that changes the next scene.",
  );
  const availableFrameworks = OUTLINE_FRAMEWORKS.filter((item) => item.type === project.type);
  const selectedFramework =
    availableFrameworks.find((item) => item.id === framework) ?? availableFrameworks[0];
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(project.id),
    queryFn: () => api.getProjectOutline(project.id),
  });
  const generate = useMutation({
    mutationFn: () =>
      api.generateProjectOutline(project.id, {
        framework,
        questionnaire,
        ...(project.type === "fiction"
          ? {
              character_arcs: characters
                .filter((character) => character.name.trim())
                .map((character) => ({
                  name: character.name.trim(),
                  arc: characterArcLabel(character.arc),
                  position: character.position.trim(),
                  sceneRole: character.sceneRole.trim(),
                })),
              scene_plan: {
                defaultCast: defaultCast.trim(),
                miniStructure: miniStructure.trim(),
              },
            }
          : {}),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectOutline(project.id) }),
      ]),
  });

  return (
    <section id="outline" className="scroll-mt-6 border-t pt-8">
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
              <SelectTrigger aria-label="Outline framework">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                {availableFrameworks.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFramework ? (
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-sm font-medium">{selectedFramework.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedFramework.description}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {selectedFramework.questions.map((question) => (
                    <li key={question} className="flex gap-2">
                      <span aria-hidden className="text-muted-foreground/60">
                        •
                      </span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Textarea
              value={questionnaire}
              onChange={(event) => setQuestionnaire(event.target.value)}
              placeholder={
                project.type === "fiction"
                  ? "Protagonist, want, weakness, opponent, world, stakes, ending choice..."
                  : "Reader, promise, proof, constraints, must-include stories..."
              }
              className="min-h-52 resize-y"
              required
            />
            {project.type === "fiction" ? (
              <div className="space-y-4 rounded-md border bg-muted/20 p-3">
                <div>
                  <h2 className="text-sm font-semibold">Character arcs</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add each important character and where they should be in their arc for this
                    outline.
                  </p>
                </div>
                <div className="space-y-3">
                  {characters.map((character, index) => (
                    <div key={character.id} className="rounded-md border bg-background p-3">
                      <div className="grid gap-3">
                        <Input
                          aria-label={`Character ${index + 1} name`}
                          value={character.name}
                          onChange={(event) =>
                            updateCharacter(setCharacters, character.id, {
                              name: event.target.value,
                            })
                          }
                          placeholder="Character name"
                        />
                        <Select
                          value={character.arc}
                          onValueChange={(value) =>
                            updateCharacter(setCharacters, character.id, { arc: value })
                          }
                        >
                          <SelectTrigger aria-label={`Character ${index + 1} arc`}>
                            <SelectValue placeholder="Arc" />
                          </SelectTrigger>
                          <SelectContent>
                            {CHARACTER_ARC_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea
                          aria-label={`Character ${index + 1} arc position`}
                          value={character.position}
                          onChange={(event) =>
                            updateCharacter(setCharacters, character.id, {
                              position: event.target.value,
                            })
                          }
                          placeholder="Where this character is in the arc at this point in the story..."
                          className="min-h-20 resize-y"
                        />
                        <Input
                          aria-label={`Character ${index + 1} scene role`}
                          value={character.sceneRole}
                          onChange={(event) =>
                            updateCharacter(setCharacters, character.id, {
                              sceneRole: event.target.value,
                            })
                          }
                          placeholder="Scene role, relationship pressure, or conflict function"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={characters.length >= CHARACTER_SLOT_IDS.length}
                  onClick={() =>
                    setCharacters((current) => [
                      ...current,
                      {
                        id: CHARACTER_SLOT_IDS[current.length],
                        name: "",
                        arc: "positive-change",
                        position: "",
                        sceneRole: "",
                      },
                    ])
                  }
                >
                  Add character
                </Button>
                <div className="space-y-3">
                  <Textarea
                    value={defaultCast}
                    onChange={(event) => setDefaultCast(event.target.value)}
                    placeholder="Default scene cast: Mara + Ivo in discovery scenes; Mara + Venn in conflict scenes..."
                    className="min-h-20 resize-y"
                  />
                  <Textarea
                    value={miniStructure}
                    onChange={(event) => setMiniStructure(event.target.value)}
                    placeholder="Three-act mini scene structure..."
                    className="min-h-24 resize-y"
                  />
                </div>
              </div>
            ) : null}
            <Button type="submit" disabled={!questionnaire.trim() || generate.isPending}>
              {generate.isPending ? "Generating..." : "Generate outline"}
            </Button>
            {generate.error ? (
              <p className="text-sm text-destructive">{generate.error.message}</p>
            ) : null}
          </div>
        </form>

        <div id="chapters" className="scroll-mt-6 rounded-lg border bg-background p-4">
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

function PublishPanel({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const pack = useQuery({
    queryKey: queryKeys.publisherPack(project.id),
    queryFn: () => api.getPublisherPack(project.id),
  });
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(project.id),
    queryFn: () => api.getProjectOutline(project.id),
  });
  const renderJobs = useQuery({
    queryKey: queryKeys.renderJobs(project.id),
    queryFn: () => api.listRenderJobs(project.id),
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => job.status === "queued" || job.status === "running")
        ? 3_000
        : false,
  });
  const auditionStatus = useQuery({
    queryKey: queryKeys.narrationAuditions(project.id),
    queryFn: () => api.listNarrationAuditions(project.id),
  });
  const audiobookJobs = useQuery({
    queryKey: queryKeys.audiobookJobs(project.id),
    queryFn: () => api.listAudiobookJobs(project.id),
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => job.status === "queued" || job.status === "running")
        ? 5_000
        : false,
  });
  const keyStatus = useQuery({
    queryKey: queryKeys.elevenLabsKey(),
    queryFn: api.getElevenLabsKeyStatus,
  });
  const [draft, setDraft] = useState<PublisherPack | null>(null);
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [voiceIds, setVoiceIds] = useState("");

  useEffect(() => {
    if (pack.data?.pack) setDraft(pack.data.pack);
  }, [pack.data?.pack]);

  const generate = useMutation({
    mutationFn: () => api.generatePublisherSeo(project.id),
    onSuccess: async ({ pack }) => {
      setDraft(pack);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.publisherPack(project.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) }),
      ]);
    },
  });
  const save = useMutation({
    mutationFn: (input: PublisherPack) =>
      api.updatePublisherPack(project.id, {
        title: input.title,
        subtitle: input.subtitle,
        series_name: input.series_name,
        description_html: input.description_html,
        keywords: input.keywords,
        bisac: input.bisac,
      }),
    onSuccess: async ({ pack }) => {
      setDraft(pack);
      await queryClient.invalidateQueries({ queryKey: queryKeys.publisherPack(project.id) });
    },
  });
  const approve = useMutation({
    mutationFn: () => api.approvePublisherPack(project.id),
    onSuccess: async ({ pack }) => {
      setDraft(pack);
      await queryClient.invalidateQueries({ queryKey: queryKeys.publisherPack(project.id) });
    },
  });
  const startExport = useMutation({
    mutationFn: () => api.startBookExport(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.renderJobs(project.id) });
    },
  });
  const saveElevenLabsKey = useMutation({
    mutationFn: () => api.saveElevenLabsKey(elevenLabsKey),
    onSuccess: async () => {
      setElevenLabsKey("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.elevenLabsKey() });
    },
  });
  const startAudition = useMutation({
    mutationFn: () => api.startNarrationAudition(project.id, parseVoiceIds(voiceIds)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.narrationAuditions(project.id) });
    },
  });
  const approveAudition = useMutation({
    mutationFn: (jobId: string) => api.approveNarrationAudition(project.id, jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.narrationAuditions(project.id) });
    },
  });
  const startAudiobook = useMutation({
    mutationFn: () => api.startAudiobookMastering(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.audiobookJobs(project.id) });
    },
  });

  const validation = draft ? validateDraftPack(draft) : [];
  const locked = draft?.status === "approved";
  const canGenerate = (outline.data?.chapters.length ?? 0) > 0;
  const canExport = locked && (outline.data?.chapters.length ?? 0) > 0;
  const canAudition =
    locked &&
    keyStatus.data?.configured &&
    parseVoiceIds(voiceIds).length > 0 &&
    (outline.data?.chapters.length ?? 0) > 0;

  return (
    <section id="publish" className="scroll-mt-6 border-t pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Publish</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Generate KDP-ready metadata from the manuscript, tune each field, and approve the
            publisher pack when it is final.
          </p>
        </div>
        {draft ? (
          <Badge variant={draft.status === "approved" ? "default" : "secondary"}>
            {draft.status === "approved" ? "Approved" : "Draft pack"}
          </Badge>
        ) : (
          <Badge variant="secondary">No publisher pack</Badge>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">SEO synthesis</h2>
              <p className="text-sm text-muted-foreground">
                Uses chapter titles, summaries, and available draft text.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={!canGenerate || generate.isPending}
                onClick={() => generate.mutate()}
              >
                {generate.isPending ? "Generating..." : "Generate SEO pack"}
              </Button>
              {draft ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={locked || save.isPending || validation.length > 0}
                  onClick={() => save.mutate(draft)}
                >
                  {save.isPending ? "Saving..." : "Save edits"}
                </Button>
              ) : null}
              {draft ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={locked || approve.isPending || validation.length > 0}
                  onClick={() => approve.mutate()}
                >
                  {approve.isPending ? "Approving..." : "Approve"}
                </Button>
              ) : null}
            </div>
            {!canGenerate ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Generate an outline before creating publisher metadata.
              </p>
            ) : null}
            {[generate.error, save.error, approve.error].filter(Boolean).map((error) => (
              <p key={String(error)} className="mt-3 text-sm text-destructive">
                {(error as Error).message}
              </p>
            ))}
            {validation.length ? (
              <ul className="mt-3 space-y-1 text-sm text-destructive">
                {validation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {draft ? (
            <div className="rounded-lg border bg-background p-4">
              <div className="grid gap-3">
                <label htmlFor="publisher-title" className="space-y-1 text-sm font-medium">
                  Title
                  <Input
                    id="publisher-title"
                    value={draft.title}
                    disabled={locked}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </label>
                <label htmlFor="publisher-subtitle" className="space-y-1 text-sm font-medium">
                  Subtitle
                  <Input
                    id="publisher-subtitle"
                    value={draft.subtitle}
                    disabled={locked}
                    onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
                  />
                </label>
                <label htmlFor="publisher-series" className="space-y-1 text-sm font-medium">
                  Series
                  <Input
                    id="publisher-series"
                    value={draft.series_name}
                    disabled={locked}
                    placeholder="Optional"
                    onChange={(event) => setDraft({ ...draft, series_name: event.target.value })}
                  />
                </label>
                <label htmlFor="publisher-description" className="space-y-1 text-sm font-medium">
                  Description HTML
                  <Textarea
                    id="publisher-description"
                    value={draft.description_html}
                    disabled={locked}
                    className="min-h-48 resize-y font-mono text-xs"
                    onChange={(event) =>
                      setDraft({ ...draft, description_html: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div id="launch" className="scroll-mt-6 rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Downloads</h2>
              <p className="text-sm text-muted-foreground">
                Export approved manuscripts to EPUB, PDF, and Kindle formats.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!canExport || startExport.isPending}
                onClick={() => startExport.mutate()}
              >
                {startExport.isPending ? "Starting..." : "Export book"}
              </Button>
            </div>
            {!canExport ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Approve the publisher pack before exporting files.
              </p>
            ) : null}
            {startExport.error ? (
              <p className="mt-3 text-sm text-destructive">{startExport.error.message}</p>
            ) : null}
            <RenderJobsList jobs={renderJobs.data?.items ?? []} />
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Narration audition</h2>
              <p className="text-sm text-muted-foreground">
                Generate a short MP3 audition from the manuscript and approve the voice for
                audiobook mastering.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  type="password"
                  value={elevenLabsKey}
                  onChange={(event) => setElevenLabsKey(event.target.value)}
                  placeholder={
                    keyStatus.data?.configured ? "ElevenLabs key saved" : "Paste ElevenLabs API key"
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!elevenLabsKey.trim() || saveElevenLabsKey.isPending}
                  onClick={() => saveElevenLabsKey.mutate()}
                >
                  {saveElevenLabsKey.isPending ? "Saving..." : "Save key"}
                </Button>
              </div>
              <Textarea
                value={voiceIds}
                onChange={(event) => setVoiceIds(event.target.value)}
                placeholder="ElevenLabs voice IDs, one per line or comma-separated"
                className="min-h-20 resize-y"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!canAudition || startAudition.isPending}
                onClick={() => startAudition.mutate()}
              >
                {startAudition.isPending ? "Rendering..." : "Audition voices"}
              </Button>
            </div>
            {!locked ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Approve the publisher pack before auditioning narration.
              </p>
            ) : null}
            {[saveElevenLabsKey.error, startAudition.error, approveAudition.error]
              .filter(Boolean)
              .map((error) => (
                <p key={String(error)} className="mt-3 text-sm text-destructive">
                  {(error as Error).message}
                </p>
              ))}
            <NarrationAuditionsList
              items={auditionStatus.data?.items ?? []}
              approved={auditionStatus.data?.approved ?? null}
              approvingId={approveAudition.variables}
              onApprove={(jobId) => approveAudition.mutate(jobId)}
            />
            <div className="mt-5 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Audiobook master</h3>
                  <p className="text-sm text-muted-foreground">
                    Render chapter narration and package ACX-ready masters.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!auditionStatus.data?.approved || startAudiobook.isPending}
                  onClick={() => startAudiobook.mutate()}
                >
                  {startAudiobook.isPending ? "Starting..." : "Master audiobook"}
                </Button>
              </div>
              {startAudiobook.error ? (
                <p className="mt-3 text-sm text-destructive">{startAudiobook.error.message}</p>
              ) : null}
              <RenderJobsList jobs={audiobookJobs.data?.items ?? []} />
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Launch handoff</h2>
                <p className="text-sm text-muted-foreground">
                  Create a go-to-market brief and downloadable handoff package.
                </p>
              </div>
              <Button asChild variant="secondary" disabled={!locked}>
                <Link to="/projects/$projectId/launch" params={{ projectId: project.id }}>
                  Open Launch
                </Link>
              </Button>
            </div>
            {!locked ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Approve the publisher pack before generating launch assets.
              </p>
            ) : null}
          </div>
        </div>

        {draft ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-background p-4">
              <h2 className="text-base font-semibold">KDP preview</h2>
              <div className="mt-4 rounded-md border bg-muted/20 p-4">
                <h3 className="text-xl font-semibold">{draft.title}</h3>
                {draft.subtitle ? (
                  <p className="mt-1 text-muted-foreground">{draft.subtitle}</p>
                ) : null}
                {draft.series_name ? (
                  <p className="mt-1 text-sm text-muted-foreground">{draft.series_name}</p>
                ) : null}
                <div
                  className="prose prose-sm mt-4 max-w-none dark:prose-invert"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: server sanitizes description tags.
                  dangerouslySetInnerHTML={{ __html: draft.description_html }}
                />
              </div>
            </div>

            <KeywordEditor
              title="Keywords"
              values={draft.keywords}
              locked={locked}
              limit={7}
              maxLength={50}
              onChange={(keywords) => setDraft({ ...draft, keywords })}
            />
            <KeywordEditor
              title="BISAC categories"
              values={draft.bisac}
              locked={locked}
              limit={2}
              maxLength={120}
              onChange={(bisac) => setDraft({ ...draft, bisac })}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            Publisher metadata will appear here after SEO synthesis.
          </div>
        )}
      </div>
    </section>
  );
}

function parseVoiceIds(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function RenderJobsList({ jobs }: { jobs: RenderJob[] }) {
  if (!jobs.length) {
    return <p className="mt-4 text-sm text-muted-foreground">No exports yet.</p>;
  }
  return (
    <div className="mt-4 divide-y rounded-md border">
      {jobs.slice(0, 9).map((job) => (
        <div
          key={job.id}
          className="grid gap-2 p-3 text-sm sm:grid-cols-[80px_1fr_auto] sm:items-center"
        >
          <span className="font-medium uppercase">{job.kind}</span>
          <span className={job.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
            {job.status}
            {job.error ? `: ${job.error}` : ""}
          </span>
          {job.download_url ? (
            <Button asChild size="sm" variant="outline">
              <a href={job.download_url}>Download</a>
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function NarrationAuditionsList({
  items,
  approved,
  approvingId,
  onApprove,
}: {
  items: NarrationAudition[];
  approved: NarrationApproval | null;
  approvingId?: string;
  onApprove: (jobId: string) => void;
}) {
  if (!items.length) {
    return <p className="mt-4 text-sm text-muted-foreground">No auditions yet.</p>;
  }
  return (
    <div className="mt-4 divide-y rounded-md border">
      {items.slice(0, 6).map((item) => {
        const isApproved = approved?.job_id === item.id;
        return (
          <div key={item.id} className="grid gap-3 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.voice_id || "Voice"}</p>
                <p
                  className={
                    item.status === "failed" ? "text-destructive" : "text-muted-foreground"
                  }
                >
                  {item.status}
                  {item.error ? `: ${item.error}` : ""}
                </p>
              </div>
              {isApproved ? <Badge>Approved</Badge> : null}
            </div>
            {item.audio_url ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                {/* biome-ignore lint/a11y/useMediaCaption: auditions are short user-generated samples without separate transcript files yet. */}
                <audio controls src={item.audio_url} className="h-9 w-full" />
                <Button
                  type="button"
                  size="sm"
                  variant={isApproved ? "secondary" : "outline"}
                  disabled={isApproved || approvingId === item.id}
                  onClick={() => onApprove(item.id)}
                >
                  {approvingId === item.id ? "Approving..." : "Approve"}
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function KeywordEditor({
  title,
  values,
  locked,
  limit,
  maxLength,
  onChange,
}: {
  title: string;
  values: string[];
  locked: boolean;
  limit: number;
  maxLength: number;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {values.length}/{limit}
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {FIELD_SLOT_IDS.slice(0, limit).map((slot, index) => (
          <Input
            key={`${title}-${slot}`}
            value={values[index] ?? ""}
            disabled={locked}
            maxLength={maxLength}
            onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function validateDraftPack(pack: PublisherPack) {
  const errors: string[] = [];
  if (!pack.title.trim()) errors.push("Title is required.");
  if (pack.description_html.length > 4000) errors.push("Description is over 4000 characters.");
  if (pack.keywords.length !== 7 || pack.keywords.some((item) => !item.trim())) {
    errors.push("Fill all 7 keywords.");
  }
  if (pack.keywords.some((item) => item.length > 50)) {
    errors.push("Each keyword must be 50 characters or fewer.");
  }
  if (pack.bisac.length !== 2 || pack.bisac.some((item) => !item.trim())) {
    errors.push("Fill both BISAC categories.");
  }
  return errors;
}

function updateCharacter(
  setCharacters: Dispatch<SetStateAction<CharacterArcDraft[]>>,
  id: string,
  patch: Partial<CharacterArcDraft>,
) {
  setCharacters((current) =>
    current.map((character) => (character.id === id ? { ...character, ...patch } : character)),
  );
}

function characterArcLabel(value: string) {
  return CHARACTER_ARC_OPTIONS.find((option) => option.value === value)?.label ?? value;
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
