import { Link } from "@tanstack/react-router";
import type { Project } from "../../lib/api";
import { BudgetMeter } from "./budget-meter";

export function TopBar({ project }: { project: Project }) {
  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-5 py-2 text-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500">📚 Books</Link>
          <span className="text-slate-400">/</span>
          <span className="font-semibold">{project.title}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <BudgetMeter spentCents={0} capCents={5000} />
          <Link to="/account" className="text-slate-500">Account</Link>
        </div>
      </div>
    </header>
  );
}
