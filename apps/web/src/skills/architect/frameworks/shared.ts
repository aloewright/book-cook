export type ProjectKind = "fiction" | "nonfiction";

export type FrameworkChapter = {
  title: string;
  summary: string;
  target_words: number;
  sections: {
    kind: string;
    prompt: string;
    target_words: number;
    beat: string;
  }[];
};

export type FrameworkOutline = {
  framework: string;
  acts: {
    title: string;
    chapters: FrameworkChapter[];
  }[];
};

export type Framework = {
  id: string;
  label: string;
  type: ProjectKind | "any";
  questions: string[];
  build(input: {
    title: string;
    genre?: string | null;
    targetWordCount: number;
    questionnaire: string;
    voiceSummary?: string;
  }): FrameworkOutline;
};

export function splitWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function chapterTarget(total: number, chapters: number) {
  return Math.max(1200, Math.round(total / chapters));
}
