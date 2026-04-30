import { heroJourneyFramework } from "./hero-journey";
import { paasFramework } from "./paas";
import type { Framework, ProjectKind } from "./shared";

export const frameworks = [
  paasFramework,
  heroJourneyFramework,
] as const satisfies readonly Framework[];

export function frameworkFor(id: string | undefined, type: ProjectKind) {
  if (id) {
    const framework = frameworks.find((item) => item.id === id);
    if (framework) return framework;
  }
  return type === "fiction" ? heroJourneyFramework : paasFramework;
}
