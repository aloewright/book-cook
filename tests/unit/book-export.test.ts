import { describe, expect, it } from "vitest";
import { manuscriptMarkdown } from "../../apps/web/src/workflows/book-export-helpers";

describe("book export workflow helpers", () => {
  it("assembles chapter drafts into a pandoc-friendly manuscript", () => {
    const manuscript = manuscriptMarkdown("My Book", [
      { ordinal: 1, title: "Start", summary: "Opening summary", draft_md: "Draft body" },
      { ordinal: 2, title: "Next", summary: "Fallback summary", draft_md: "" },
    ]);

    expect(manuscript).toContain("% My Book");
    expect(manuscript).toContain("# 1. Start\n\nDraft body");
    expect(manuscript).toContain("# 2. Next\n\nFallback summary");
  });
});
