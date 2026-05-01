import { frameworkFor } from "./architect/frameworks";
import type {
  CharacterArcGuidance,
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

  return framework.build({
    title: input.title,
    genre: input.genre,
    targetWordCount: input.targetWordCount,
    questionnaire: input.questionnaire,
    voiceSummary,
    characterArcs: input.characterArcs,
    scenePlan: input.scenePlan,
  });
}
