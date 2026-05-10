import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import FullBookPanel from "../components/panels/FullBookPanel";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/projects/$projectId/book")({ component: FullBookPage });

function FullBookPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-8">
      <div className="sticky top-0 z-30 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void navigate({ to: "/projects/$projectId", params: { projectId } })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </Button>
      </div>
      <FullBookPanel projectId={projectId} />
    </section>
  );
}
