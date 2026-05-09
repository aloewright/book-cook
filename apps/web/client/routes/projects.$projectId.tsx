import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MotionPanel } from "../components/animation/motion";
import { EditorialAssistantSidecar } from "../components/chat/aloysius-sidecar";
import ConceptScoutPanel from "../components/panels/ConceptScoutPanel";
import OutlineBuilder from "../components/panels/OutlineBuilder";
import PublishPanel from "../components/panels/PublishPanel";
import VoicePanel from "../components/panels/VoicePanel";
import WorkflowHeader from "../components/panels/WorkflowHeader";
import {
  outlineTabFromWorkflowChild,
  replaceWorkspaceHash,
  workflowChildFromHash,
  workflowFromHash,
  workflowStatuses,
} from "../components/panels/_shared";
import { OutlineRail, type WorkflowKey } from "../components/workspace/outline-rail";
import { TopBar } from "../components/workspace/top-bar";
import { api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectWorkspace });

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowKey>(() => workflowFromHash());
  const [workflowChild, setWorkflowChild] = useState(() => workflowChildFromHash());
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });
  const outline = useQuery({
    queryKey: queryKeys.projectOutline(projectId),
    queryFn: () => api.getProjectOutline(projectId),
  });
  const scout = useQuery({
    queryKey: queryKeys.projectScoutFindings(projectId),
    queryFn: () => api.listProjectScoutFindings(projectId),
  });
  const pack = useQuery({
    queryKey: queryKeys.publisherPack(projectId),
    queryFn: () => api.getPublisherPack(projectId),
  });

  useEffect(() => {
    const syncHash = () => {
      setWorkflow(workflowFromHash());
      setWorkflowChild(workflowChildFromHash());
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  if (
    location.pathname.includes("/chapters/") ||
    location.pathname.includes("/launch") ||
    location.pathname.includes("/book")
  ) {
    return <Outlet />;
  }

  if (project.isLoading || !project.data) {
    return <p className="px-6 py-12 text-slate-500">Loading…</p>;
  }

  const statuses = workflowStatuses({
    project: project.data,
    scoutCount: scout.data?.items.length ?? 0,
    chapterCount: outline.data?.chapters.length ?? 0,
    draftedChapterCount:
      outline.data?.chapters.filter((chapter) => chapter.draft_md.trim().length > 0).length ?? 0,
    publisherStatus: pack.data?.pack?.status ?? null,
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-project-workspace>
      <TopBar project={project.data} />
      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_360px] overflow-hidden">
        <OutlineRail
          active={workflow}
          activeChild={workflowChild}
          statuses={statuses}
          onSelect={(mode, child) => {
            if (mode === "book") {
              void navigate({ to: "/projects/$projectId/book", params: { projectId } });
              return;
            }
            if (mode === "launch") {
              void navigate({ to: "/projects/$projectId/launch", params: { projectId } });
              return;
            }
            setWorkflow(mode);
            setWorkflowChild(child);
            replaceWorkspaceHash(child ? `${mode}:${child}` : mode);
          }}
        />
        <main className="overflow-y-auto px-6 py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <WorkflowHeader
              workflow={workflow}
              statuses={statuses}
              project={project.data}
              scoutCount={scout.data?.items.length ?? 0}
              chapterCount={outline.data?.chapters.length ?? 0}
              draftedChapterCount={
                outline.data?.chapters.filter((chapter) => chapter.draft_md.trim().length > 0)
                  .length ?? 0
              }
              publisherStatus={pack.data?.pack?.status ?? null}
            />
            <MotionPanel motionKey={workflow}>
              {workflow === "concept" ? <ConceptScoutPanel project={project.data} /> : null}
              {workflow === "voice" ? <VoicePanel project={project.data} /> : null}
              {workflow === "outline" || workflow === "chapters" ? (
                <OutlineBuilder
                  project={project.data}
                  view={workflow}
                  requestedTab={outlineTabFromWorkflowChild(workflowChild)}
                />
              ) : null}
              {workflow === "publish" ? <PublishPanel project={project.data} /> : null}
            </MotionPanel>
          </div>
        </main>
        <EditorialAssistantSidecar projectId={projectId} />
      </div>
    </div>
  );
}
