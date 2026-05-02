import { Suspense, lazy } from "react";
import { usePrefersReducedMotion } from "./use-gsap-timeline";

const STEPS = ["Outline", "Chapters", "Draft", "Full Book"] as const;
const BookFlowPlayer = lazy(() => import("./book-flow-player"));

export function BookFlowPreview() {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return (
      <div className="rounded-lg border bg-muted/20 p-4" data-testid="book-flow-static">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Book flow</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((step) => (
            <span key={step} className="rounded-full border bg-background px-3 py-1 text-sm">
              {step}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border bg-background"
      data-testid="book-flow-preview"
    >
      <Suspense fallback={<BookFlowStatic />}>
        <BookFlowPlayer />
      </Suspense>
    </div>
  );
}

function BookFlowStatic() {
  return (
    <div className="p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Book flow</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <span key={step} className="rounded-full border bg-background px-3 py-1 text-sm">
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
