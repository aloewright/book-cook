import { createFileRoute } from "@tanstack/react-router";
import { EditorialAssistantSidecar } from "../components/chat/aloysius-sidecar";
import ChapterEditorPanel from "../components/panels/ChapterEditorPanel";

export const Route = createFileRoute("/projects/$projectId/chapters/$chapterId")({
  component: ChapterEditorRoute,
});

function ChapterEditorRoute() {
  const { projectId, chapterId } = Route.useParams();

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] overflow-hidden">
      <ChapterEditorPanel projectId={projectId} chapterId={chapterId} />
      <EditorialAssistantSidecar projectId={projectId} />
    </div>
  );
}
