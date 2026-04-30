import { describe, expect, it } from "vitest";
import { generateOutline } from "../../apps/web/src/skills/architect";

describe("architect outline generation", () => {
  it("builds nonfiction chapter structure", () => {
    const outline = generateOutline({
      title: "Better Systems",
      type: "nonfiction",
      targetWordCount: 45_000,
      questionnaire: "Readers are stuck in reactive work. Promise a calmer operating model.",
    });

    expect(outline.framework).toBe("paas");
    expect(outline.acts).toHaveLength(3);
    expect(outline.acts.flatMap((act) => act.chapters)).toHaveLength(9);
  });

  it("builds fiction chapter structure", () => {
    const outline = generateOutline({
      title: "The Last Harbor",
      type: "fiction",
      targetWordCount: 72_000,
      questionnaire: "A captain wants to save their town but must betray an old oath.",
    });

    expect(outline.framework).toBe("hero-journey");
    expect(outline.acts.flatMap((act) => act.chapters)).toHaveLength(12);
  });
});
