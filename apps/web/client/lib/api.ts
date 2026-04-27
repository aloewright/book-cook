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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${(body as { error?: { message?: string } }).error?.message ?? res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type Project = {
  id: string;
  title: string;
  type: "nonfiction" | "fiction";
  status: string;
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
  deleteProject: (id: string) =>
    fetch(`/api/v1/projects/${id}`, { method: "DELETE", credentials: "include" }),
  me: () => fetchJson<{ user: { id: string; email: string; plan: string } }>("/api/v1/account/me"),
};

export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  me: () => ["me"] as const,
};
