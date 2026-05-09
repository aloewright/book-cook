import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
});

let redirectingToSignIn = false;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (res.status === 401) {
    if (
      typeof window !== "undefined" &&
      !redirectingToSignIn &&
      !window.location.pathname.startsWith("/sign-")
    ) {
      redirectingToSignIn = true;
      window.location.assign("/sign-in");
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `${res.status}: ${(body as { error?: { message?: string } }).error?.message ?? res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

export type Project = {
  id: string;
  title: string;
  type: "nonfiction" | "fiction";
  status: string;
  voice_id?: string | null;
  created_at: number;
  updated_at: number;
  deleted_at?: number | string | null;
};

export type VoiceSample = {
  id: string;
  voice_id: string;
  r2_key: string;
  source: "paste" | "upload" | "url";
  word_count: number;
  created_at: number;
};

export type Voice = {
  id: string;
  name: string;
  source: "custom" | "postpilot";
  postpilot_slug?: string | null;
  profile_md: string;
  profile_json: unknown;
  created_at: number;
  updated_at: number;
  samples?: VoiceSample[];
};

export type PostPilotGuide = {
  slug: string;
  author: string;
  era?: string;
  kicker?: string;
  standfirst?: string;
  copyright_posture?: string;
};

export type Chapter = {
  id: string;
  project_id: string;
  ordinal: number;
  title: string;
  summary: string;
  status: string;
  target_words: number;
  draft_json?: unknown;
  draft_md: string;
  created_at: number;
  updated_at: number;
};

export type Section = {
  id: string;
  chapter_id: string;
  ordinal: number;
  kind: string;
  prompt: string;
  draft_md: string;
  status: "pending" | "generating" | "drafted" | "approved";
  created_at: number;
  updated_at: number;
};

export type Revision = {
  id: string;
  target_table: string;
  target_id: string;
  before_md: string;
  after_md: string;
  llm_response?: unknown;
  created_at?: number;
};

export type InlineEditAction = "rewrite" | "tighten" | "expand" | "change-tone" | "fix-grammar";
export type InlineEditTone = "formal" | "casual" | "punchy";

export type ProjectOutline = {
  id: string;
  project_id: string;
  framework: string;
  structure_json: unknown;
  version: number;
  created_at: number;
  updated_at: number;
};

export type CharacterArcInput = {
  name: string;
  arc: string;
  position: string;
  sceneRole?: string;
};

export type ScenePlanInput = {
  defaultCast?: string;
  miniStructure?: string;
};

export type ChapterPlanInput = {
  ordinal: number;
  title?: string;
  event: string;
  purpose?: string;
  pov?: string;
  characters?: string;
};

export type PublisherPack = {
  id: string;
  title: string;
  subtitle: string;
  series_name: string;
  description_html: string;
  keywords: string[];
  bisac: string[];
  status: "draft" | "approved";
};

export type RenderJob = {
  id: string;
  project_id: string;
  kind: "epub" | "docx" | "pdf" | "kpf" | "narration" | "master_mix";
  status: "queued" | "running" | "completed" | "failed";
  workflow_id?: string | null;
  output_r2_key?: string | null;
  error?: string | null;
  started_at: number;
  completed_at?: number | null;
  cost_cents: number;
  download_url?: string | null;
};

export type ExportKind = "epub" | "pdf" | "kpf";

export type FullBookChapter = {
  id?: string;
  ordinal: number;
  title: string;
  summary: string;
  body_md: string;
  word_count: number;
  has_draft: boolean;
};

export type FullBookView = {
  title: string;
  chapters: FullBookChapter[];
  manuscript_md: string;
  total_words: number;
  drafted_chapters: number;
};

export type NarrationAudition = RenderJob & {
  voice_id: string;
  audio_url?: string | null;
};

export type NarrationApproval = {
  job_id: string;
  voice_id: string;
  output_r2_key: string;
  approved_at: string;
};

export type MarketRecord = {
  source: "kdp" | "trends" | "library";
  niche: string;
  title: string;
  author: string;
  rank: number;
  signal: string;
  keywords: string[];
  observed_at: string;
};

export type ScoutEvidence = {
  dataset: {
    snapshot_id: string;
    week_iso: string;
    r2_key: string;
    source: string;
  };
  niche: string;
  type: "nonfiction" | "fiction";
  input_context?: {
    audience?: string;
    angle?: string;
  };
  records: MarketRecord[];
  source_mix?: {
    kdp: number;
    trends: number;
    library: number;
  };
  keyword_counts?: { keyword: string; count: number }[];
  opportunity_score?: number;
  confidence?: "low" | "medium" | "high";
  audience_brief?: string;
  positioning_brief?: string;
  verdict?: {
    status: "ready" | "validate" | "reframe";
    label: string;
    rationale: string;
  };
  concept_brief?: {
    audience: string;
    promise: string;
    differentiator: string;
    must_prove: string;
  };
  gaps: string[];
  recommendations: string[];
  validation_steps?: string[];
  next_questions?: string[];
};

export type ScoutQuery = {
  id: string;
  user_id: string;
  project_id?: string | null;
  niche: string;
  type: "nonfiction" | "fiction";
  params_json: Record<string, unknown>;
  created_at: string | number;
};

export type ScoutFinding = {
  id: string;
  query_id: string;
  dataset_snapshot_id: string;
  summary_md: string;
  evidence_json: ScoutEvidence;
  created_at: string | number;
};

export type ScoutResult = {
  query: ScoutQuery;
  finding: ScoutFinding;
  snapshot?: {
    id: string;
    week_iso: string;
    r2_key: string;
    source: string;
    created_at: string | number;
  };
};

export type GtmBriefContent = {
  title: string;
  subtitle: string;
  positioning: string;
  comp_titles: string[];
  launch_checklist: string[];
  preorder_copy: { headline: string; body: string };
  email_sequence: { subject: string; body: string }[];
  ad_headlines: string[];
  arc_reader_brief: string;
  milestones: {
    week_1: string[];
    month_1: string[];
    month_3: string[];
  };
};

export type GtmBrief = {
  id: string;
  project_id: string;
  content_json: GtmBriefContent;
  brief_md: string;
  r2_key: string;
  created_at: string | number;
  updated_at: string | number;
  download_url?: string | null;
};

export const api = {
  listProjects: () => fetchJson<{ items: Project[] }>("/api/v1/projects"),
  listDeletedProjects: () =>
    fetchJson<{ items: Project[]; retention_days: number }>("/api/v1/projects/deleted/recent"),
  createProject: (input: { title: string; type: "nonfiction" | "fiction" }) =>
    fetchJson<{ id: string }>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  generateLogline: (input: {
    protagonist?: string;
    conflict?: string;
    stakes?: string;
    type?: "fiction" | "nonfiction";
  }) =>
    fetchJson<{ logline: string }>("/api/v1/compose/logline", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getProject: (id: string) => fetchJson<Project>(`/api/v1/projects/${id}`),
  getProjectOutline: (id: string) =>
    fetchJson<{ outline: ProjectOutline | null; chapters: Chapter[] }>(
      `/api/v1/projects/${id}/outline`,
    ),
  generateProjectOutline: (
    id: string,
    input: {
      framework?: string;
      questionnaire: string;
      character_arcs?: CharacterArcInput[];
      scene_plan?: ScenePlanInput;
      chapter_plan?: ChapterPlanInput[];
    },
  ) =>
    fetchJson<{ id: string; outline: unknown; chapters_created: number }>(
      `/api/v1/projects/${id}/outlines`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    ),
  getPublisherPack: (id: string) =>
    fetchJson<{ pack: PublisherPack | null }>(`/api/v1/projects/${id}/publisher-pack`),
  generatePublisherSeo: (id: string) =>
    fetchJson<{ pack: PublisherPack; llm_response: unknown }>(
      `/api/v1/projects/${id}/publisher-pack/seo`,
      { method: "POST" },
    ),
  updatePublisherPack: (id: string, input: Omit<PublisherPack, "id" | "status">) =>
    fetchJson<{ pack: PublisherPack }>(`/api/v1/projects/${id}/publisher-pack`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  approvePublisherPack: (id: string) =>
    fetchJson<{ pack: PublisherPack }>(`/api/v1/projects/${id}/publisher-pack/approve`, {
      method: "POST",
    }),
  getFullBook: (id: string) =>
    fetchJson<{
      project: Pick<Project, "id" | "title">;
      book: FullBookView;
      export_formats: ExportKind[];
    }>(`/api/v1/projects/${id}/book`),
  listRenderJobs: (id: string) =>
    fetchJson<{ items: RenderJob[] }>(`/api/v1/projects/${id}/export/jobs`),
  startBookExport: (id: string, input?: { formats?: ExportKind[] }) =>
    fetchJson<{ id: string }>(`/api/v1/projects/${id}/export`, {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    }),
  getElevenLabsKeyStatus: () =>
    fetchJson<{ configured: boolean }>("/api/v1/account/elevenlabs-key"),
  saveElevenLabsKey: (apiKey: string) =>
    fetchJson<{ configured: boolean }>("/api/v1/account/elevenlabs-key", {
      method: "PUT",
      body: JSON.stringify({ api_key: apiKey }),
    }),
  listNarrationAuditions: (id: string) =>
    fetchJson<{ items: NarrationAudition[]; approved: NarrationApproval | null }>(
      `/api/v1/projects/${id}/narration/auditions`,
    ),
  startNarrationAudition: (id: string, voiceIds: string[]) =>
    fetchJson<{ items: NarrationAudition[]; script: { chunks: number } }>(
      `/api/v1/projects/${id}/narration/audition`,
      {
        method: "POST",
        body: JSON.stringify({ elevenlabs_voice_ids: voiceIds }),
      },
    ),
  approveNarrationAudition: (id: string, jobId: string) =>
    fetchJson<{ approved: NarrationApproval }>(
      `/api/v1/projects/${id}/narration/auditions/${jobId}/approve`,
      { method: "POST" },
    ),
  listAudiobookJobs: (id: string) =>
    fetchJson<{ items: RenderJob[] }>(`/api/v1/projects/${id}/audiobook/jobs`),
  startAudiobookMastering: (id: string) =>
    fetchJson<{ id: string }>(`/api/v1/projects/${id}/audiobook`, { method: "POST" }),
  listScoutQueries: () => fetchJson<{ items: ScoutResult[] }>("/api/v1/scout/queries"),
  createScoutQuery: (input: {
    niche: string;
    type: "nonfiction" | "fiction";
    project_id?: string;
    params?: Record<string, unknown>;
  }) =>
    fetchJson<ScoutResult>("/api/v1/scout/queries", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listProjectScoutFindings: (id: string) =>
    fetchJson<{ items: ScoutResult[] }>(`/api/v1/scout/projects/${id}/findings`),
  getGtmBrief: (id: string) =>
    fetchJson<{ brief: GtmBrief | null }>(`/api/v1/projects/${id}/launch/brief`),
  startGtmBrief: (id: string) =>
    fetchJson<{ id: string }>(`/api/v1/projects/${id}/launch/brief`, { method: "POST" }),
  getChapter: (id: string) => fetchJson<Chapter>(`/api/v1/chapters/${id}`),
  getChapterSections: (id: string) =>
    fetchJson<{ items: Section[] }>(`/api/v1/chapters/${id}/sections`),
  draftSection: (chapterId: string, sectionId: string, input?: { instruction?: string }) =>
    fetchJson<{ section: Section; revision: Revision }>(
      `/api/v1/chapters/${chapterId}/sections/${sectionId}/draft`,
      {
        method: "POST",
        body: JSON.stringify(input ?? {}),
      },
    ),
  updateSection: (
    chapterId: string,
    sectionId: string,
    input: { status?: Section["status"]; draft_md?: string },
  ) =>
    fetchJson<{ ok: true }>(`/api/v1/chapters/${chapterId}/sections/${sectionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  getChapterRevisions: (id: string) =>
    fetchJson<{ items: Revision[] }>(`/api/v1/chapters/${id}/revisions`),
  reviseChapterSelection: (
    id: string,
    input: {
      action: InlineEditAction;
      tone?: InlineEditTone;
      text: string;
      context_md?: string;
    },
  ) =>
    fetchJson<{ revision: Revision }>(`/api/v1/chapters/${id}/revise`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateChapter: (
    id: string,
    input: { draft_json?: unknown; draft_md?: string; status?: Chapter["status"] },
  ) =>
    fetchJson<{ ok: true }>(`/api/v1/chapters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateProject: (id: string, input: { voice_id?: string | null }) =>
    fetchJson<{ ok: true }>(`/api/v1/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  getProjectChat: (id: string) =>
    fetchJson<{ items: { role: "user" | "assistant"; text: string }[] }>(
      `/api/v1/projects/${id}/chat`,
    ),
  deleteProject: (id: string) =>
    fetch(`/api/v1/projects/${id}`, { method: "DELETE", credentials: "include" }),
  restoreProject: (id: string) =>
    fetchJson<{ ok: true }>(`/api/v1/projects/${id}/restore`, { method: "POST" }),
  listVoices: () => fetchJson<{ items: Voice[] }>("/api/v1/voices"),
  listPostPilotGuides: () =>
    fetchJson<{ items: PostPilotGuide[] }>("/api/v1/voices/postpilot-guides"),
  getVoice: (id: string) => fetchJson<Voice>(`/api/v1/voices/${id}`),
  createVoice: (input: { name: string; samples?: { source: "paste"; text: string }[] }) =>
    fetchJson<{ id: string }>("/api/v1/voices", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  importPostPilotVoice: (input: { slug: string }) =>
    fetchJson<{ id: string }>("/api/v1/voices/import-postpilot", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  addVoiceSample: (id: string, input: { source: "paste" | "url"; text?: string; url?: string }) =>
    fetchJson<{ ok: true }>(`/api/v1/voices/${id}/samples`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => fetchJson<{ user: { id: string; email: string; plan: string } }>("/api/v1/account/me"),
  maybeMe: async () => {
    const res = await fetch("/api/v1/session", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `${res.status}: ${(body as { error?: { message?: string } }).error?.message ?? res.statusText}`,
      );
    }
    return res.json() as Promise<{ user: { id: string; email: string; plan?: string } | null }>;
  },
};

export const queryKeys = {
  projects: () => ["projects"] as const,
  deletedProjects: () => ["projects", "deleted"] as const,
  project: (id: string) => ["projects", id] as const,
  projectOutline: (id: string) => ["projects", id, "outline"] as const,
  fullBook: (id: string) => ["projects", id, "book"] as const,
  publisherPack: (id: string) => ["projects", id, "publisher-pack"] as const,
  renderJobs: (id: string) => ["projects", id, "render-jobs"] as const,
  narrationAuditions: (id: string) => ["projects", id, "narration-auditions"] as const,
  audiobookJobs: (id: string) => ["projects", id, "audiobook-jobs"] as const,
  scoutQueries: () => ["scout", "queries"] as const,
  projectScoutFindings: (id: string) => ["projects", id, "scout-findings"] as const,
  gtmBrief: (id: string) => ["projects", id, "gtm-brief"] as const,
  elevenLabsKey: () => ["account", "elevenlabs-key"] as const,
  chapter: (id: string) => ["chapters", id] as const,
  chapterSections: (id: string) => ["chapters", id, "sections"] as const,
  chapterRevisions: (id: string) => ["chapters", id, "revisions"] as const,
  voices: () => ["voices"] as const,
  postPilotGuides: () => ["voices", "postpilot-guides"] as const,
  voice: (id: string) => ["voices", id] as const,
  me: () => ["me"] as const,
};
