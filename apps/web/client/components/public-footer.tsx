import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          <BookOpen className="h-4 w-4" />
          Book Cook
        </Link>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
