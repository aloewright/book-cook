import { Link } from "@tanstack/react-router";
import type { Project } from "../../lib/api";
import { Badge } from "../ui/badge";
import { BudgetMeter } from "./budget-meter";

export function TopBar({ project }: { project: Project }) {
  return (
    <header className="shrink-0 border-b bg-background">
      <div className="flex items-center justify-between px-5 py-2 text-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            📚 Books
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{project.title}</span>
          <Badge variant="secondary">{project.status}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <BudgetMeter spentCents={0} capCents={5000} />
          <Link to="/account" className="text-muted-foreground hover:text-foreground">
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}
