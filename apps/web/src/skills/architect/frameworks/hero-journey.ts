import { type Framework, chapter, chapterTarget, voiceDirection } from "./shared";

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
  build({ title, genre, targetWordCount, questionnaire, voiceSummary }) {
    const perChapter = chapterTarget(targetWordCount, 12);
    const context = questionnaire || `A ${genre || "fiction"} story titled ${title}.`;
    const voice = voiceDirection(voiceSummary);
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
          chapters: beats.slice(0, 4).map((beat) => heroChapter(beat, context, perChapter, voice)),
        },
        {
          title: "Initiation",
          chapters: beats.slice(4, 9).map((beat) => heroChapter(beat, context, perChapter, voice)),
        },
        {
          title: "Return",
          chapters: beats.slice(9).map((beat) => heroChapter(beat, context, perChapter, voice)),
        },
      ],
    };
  },
};

function heroChapter(beat: string, context: string, targetWords: number, voice: string) {
  return chapter(beat, `${beat}: ${context}`, targetWords, [
    {
      kind: "scene",
      prompt: `Draft a scene that expresses the ${beat} beat.${voice}`,
      share: 0.7,
      beat,
    },
    {
      kind: "turn",
      prompt: `End with a consequential turn that changes the protagonist's options.${voice}`,
      share: 0.3,
      beat: "Chapter turn",
    },
  ]);
}
