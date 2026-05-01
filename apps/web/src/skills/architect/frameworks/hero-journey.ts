import { type Framework, chapter, chapterTarget, fictionGuidance, voiceDirection } from "./shared";

export const heroJourneyFramework: Framework = {
  id: "hero-journey",
  label: "Hero's Journey",
  type: "fiction",
  questions: [
    "Who is the protagonist and what do they want?",
    "What wound or false belief keeps them stuck?",
    "What forces them out of the ordinary world?",
    "What choice proves they have changed?",
  ],
  build({ title, genre, targetWordCount, questionnaire, voiceSummary, characterArcs, scenePlan }) {
    const perChapter = chapterTarget(targetWordCount, 12);
    const context = questionnaire || `A ${genre || "fiction"} story titled ${title}.`;
    const guidance = `${voiceDirection(voiceSummary)}${fictionGuidance({ characterArcs, scenePlan })}`;
    const beats = [
      "Ordinary World",
      "Call to Adventure",
      "Refusal",
      "Mentor",
      "Threshold",
      "Tests",
      "Approach",
      "Ordeal",
      "Reward",
      "Road Back",
      "Resurrection",
      "Return",
    ];
    return {
      framework: "hero-journey",
      acts: [
        {
          title: "Departure",
          chapters: beats
            .slice(0, 4)
            .map((beat) => heroChapter(beat, context, perChapter, guidance)),
        },
        {
          title: "Initiation",
          chapters: beats
            .slice(4, 9)
            .map((beat) => heroChapter(beat, context, perChapter, guidance)),
        },
        {
          title: "Return",
          chapters: beats.slice(9).map((beat) => heroChapter(beat, context, perChapter, guidance)),
        },
      ],
    };
  },
};

function heroChapter(beat: string, context: string, targetWords: number, guidance: string) {
  return chapter(beat, `${beat}: ${context}`, targetWords, [
    {
      kind: "scene",
      prompt: `Draft a scene that expresses the ${beat} beat.${guidance}`,
      share: 0.7,
      beat,
    },
    {
      kind: "turn",
      prompt: `End with a consequential turn that changes the protagonist's options.${guidance}`,
      share: 0.3,
      beat: "Chapter turn",
    },
  ]);
}
