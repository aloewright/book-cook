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

  it("builds Truby-style 22 beat fiction structure", () => {
    const outline = generateOutline({
      title: "The Last Harbor",
      type: "fiction",
      targetWordCount: 88_000,
      framework: "truby-22",
      questionnaire: "A captain wants to save their town but must betray an old oath.",
    });

    expect(outline.framework).toBe("truby-22");
    expect(outline.acts.flatMap((act) => act.chapters)).toHaveLength(22);
    expect(outline.acts[0].chapters[0].title).toBe("Need and weakness");
  });

  it("builds genre-specific fiction structures", () => {
    const thriller = generateOutline({
      title: "Dead Switch",
      type: "fiction",
      targetWordCount: 75_000,
      framework: "thriller",
      questionnaire: "A journalist finds a dead man's warning and becomes the next target.",
    });
    const sciFi = generateOutline({
      title: "Signal Garden",
      type: "fiction",
      targetWordCount: 84_000,
      framework: "sci-fi",
      questionnaire: "A botanist discovers plants that store memories from future colonists.",
    });

    expect(thriller.framework).toBe("thriller");
    expect(thriller.acts.flatMap((act) => act.chapters)).toHaveLength(15);
    expect(sciFi.framework).toBe("sci-fi");
    expect(sciFi.acts.flatMap((act) => act.chapters)).toHaveLength(14);
  });

  it("builds reader transformation nonfiction structure", () => {
    const outline = generateOutline({
      title: "Better Systems",
      type: "nonfiction",
      targetWordCount: 48_000,
      framework: "reader-transformation",
      questionnaire: "Readers need to move from reactive work to calm weekly planning.",
    });

    expect(outline.framework).toBe("reader-transformation");
    expect(outline.acts.flatMap((act) => act.chapters)).toHaveLength(12);
    expect(outline.acts[2].title).toBe("Apply");
  });

  it("does not apply a framework from the wrong project type", () => {
    const outline = generateOutline({
      title: "Better Systems",
      type: "nonfiction",
      targetWordCount: 45_000,
      framework: "thriller",
      questionnaire: "Readers are stuck in reactive work.",
    });

    expect(outline.framework).toBe("paas");
  });
});
