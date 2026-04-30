import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
});

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/sign-")) {
      window.location.href = "/sign-in";
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

export const api = {
  listProjects: () => fetchJson<{ items: Project[] }>("/api/v1/projects"),
  createProject: (input: { title: string; type: "nonfiction" | "fiction" }) =>
    fetchJson<{ id: string }>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getProject: (id: string) => fetchJson<Project>(`/api/v1/projects/${id}`),
  getProjectOutline: (id: string) =>
    fetchJson<{ outline: ProjectOutline | null; chapters: Chapter[] }>(
      `/api/v1/projects/${id}/outline`,
    ),
  generateProjectOutline: (id: string, input: { framework?: string; questionnaire: string }) =>
    fetchJson<{ id: string; outline: unknown; chapters_created: number }>(
      `/api/v1/projects/${id}/outlines`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    ),
  getChapter: (id: string) => fetchJson<Chapter>(`/api/v1/chapters/${id}`),
  getChapterSections: (id: string) =>
    fetchJson<{ items: Section[] }>(`/api/v1/chapters/${id}/sections`),
  draftSection: (chapterId: string, sectionId: string) =>
    fetchJson<{ section: Section; revision: Revision }>(
      `/api/v1/chapters/${chapterId}/sections/${sectionId}/draft`,
      { method: "POST" },
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
  listVoices: () => fetchJson<{ items: Voice[] }>("/api/v1/voices"),
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
};

export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  projectOutline: (id: string) => ["projects", id, "outline"] as const,
  chapter: (id: string) => ["chapters", id] as const,
  chapterSections: (id: string) => ["chapters", id, "sections"] as const,
  chapterRevisions: (id: string) => ["chapters", id, "revisions"] as const,
  voices: () => ["voices"] as const,
  voice: (id: string) => ["voices", id] as const,
  me: () => ["me"] as const,
};
