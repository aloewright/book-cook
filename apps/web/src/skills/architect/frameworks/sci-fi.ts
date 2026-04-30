import { type Framework, chapter, chapterTarget, voiceDirection } from "./shared";

const BEATS = [
  "World signal",
  "Human problem",
  "Impossible discovery",
  "Crossing the threshold",
  "Rules of the system",
  "First cost",
  "Faction pressure",
  "Paradigm shift",
  "Technology turns",
  "Ethical fracture",
  "Scale reveal",
  "Sacrifice design",
  "New future choice",
  "Changed world",
] as const;

export const sciFiFramework: Framework = {
  id: "sci-fi",
  label: "Sci-Fi World + Idea",
  type: "fiction",
  questions: [
    "What speculative premise changes ordinary life?",
    "What rule makes the world feel consistent?",
    "What human conflict keeps the idea emotional?",
    "What ethical choice should the ending force?",
  ],
  build({ title, genre, targetWordCount, questionnaire, voiceSummary }) {
    const perChapter = chapterTarget(targetWordCount, BEATS.length);
    const context = questionnaire || `A ${genre || "science fiction"} story titled ${title}.`;
    const voice = voiceDirection(voiceSummary);
    return {
      framework: "sci-fi",
      acts: [
        {
          title: "Premise",
          chapters: BEATS.slice(0, 5).map((beat) => sciFiChapter(beat, context, perChapter, voice)),
        },
        {
          title: "Consequence",
          chapters: BEATS.slice(5, 10).map((beat) =>
            sciFiChapter(beat, context, perChapter, voice),
          ),
        },
        {
          title: "Choice",
          chapters: BEATS.slice(10).map((beat) => sciFiChapter(beat, context, perChapter, voice)),
        },
      ],
    };
  },
};

function sciFiChapter(beat: string, context: string, targetWords: number, voice: string) {
  return chapter(
    beat,
    `${beat}: make the speculative idea visible through character action. ${context}`,
    targetWords,
    [
      {
        kind: "world",
        prompt: `Reveal one concrete rule, technology, place, or social consequence for ${beat}.${voice}`,
        share: 0.35,
        beat,
      },
      {
        kind: "character",
        prompt: `Tie the speculative premise to a human want, fear, relationship, or cost.${voice}`,
        share: 0.45,
        beat: "Human consequence",
      },
      {
        kind: "idea-turn",
        prompt: `End by changing what the reader or protagonist understands about the premise.${voice}`,
        share: 0.2,
        beat: "Idea turn",
      },
    ],
  );
}
