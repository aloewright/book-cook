import { frameworkFor } from "./architect/frameworks";
import type {
  ChapterPlanGuidance,
  CharacterArcGuidance,
  FrameworkChapter,
  FrameworkOutline,
  ProjectKind,
  ScenePlanGuidance,
} from "./architect/frameworks/shared";

export type GenerateOutlineInput = {
  title: string;
  type: ProjectKind;
  genre?: string | null;
  targetWordCount: number;
  framework?: string;
  questionnaire: string;
  voiceProfile?: unknown;
  characterArcs?: CharacterArcGuidance[];
  scenePlan?: ScenePlanGuidance;
  chapterPlan?: ChapterPlanGuidance[];
};

export function generateOutline(input: GenerateOutlineInput): FrameworkOutline {
  const framework = frameworkFor(input.framework, input.type);
  const voiceSummary =
    input.voiceProfile &&
    typeof input.voiceProfile === "object" &&
    "summary" in input.voiceProfile &&
    typeof input.voiceProfile.summary === "string"
      ? input.voiceProfile.summary
      : undefined;

  const outline = framework.build({
    title: input.title,
    genre: input.genre,
    targetWordCount: input.targetWordCount,
    questionnaire: input.questionnaire,
    voiceSummary,
    characterArcs: input.characterArcs,
    scenePlan: input.scenePlan,
    chapterPlan: input.chapterPlan,
  });
  return applyChapterPlan(outline, input.chapterPlan);
}

function applyChapterPlan(
  outline: FrameworkOutline,
  chapterPlan: ChapterPlanGuidance[] | undefined,
): FrameworkOutline {
  const plansByOrdinal = new Map(
    (chapterPlan ?? [])
      .filter((plan) => plan.event.trim())
      .map((plan) => [plan.ordinal, plan] as const),
  );
  if (!plansByOrdinal.size) return outline;

  let ordinal = 1;
  return {
    ...outline,
    acts: outline.acts.map((act) => ({
      ...act,
      chapters: act.chapters.map((chapter) => {
        const plan = plansByOrdinal.get(ordinal);
        ordinal += 1;
        return plan ? applyPlanToChapter(chapter, plan) : chapter;
      }),
    })),
  };
}

function applyPlanToChapter(
  chapter: FrameworkChapter,
  plan: ChapterPlanGuidance,
): FrameworkChapter {
  const plannedContext = chapterPlanContext(plan);
  return {
    ...chapter,
    title: plan.title?.trim() || chapter.title,
    summary: `${chapter.summary} Chapter decision: ${plannedContext}`,
    sections: chapter.sections.map((section) => ({
      ...section,
      prompt: `${section.prompt} Chapter decision: ${plannedContext}`,
    })),
  };
}

function chapterPlanContext(plan: ChapterPlanGuidance) {
  return [
    `event: ${plan.event.trim()}`,
    plan.purpose?.trim() ? `purpose: ${plan.purpose.trim()}` : "",
    plan.pov?.trim() ? `POV: ${plan.pov.trim()}` : "",
    plan.characters?.trim() ? `characters: ${plan.characters.trim()}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}
