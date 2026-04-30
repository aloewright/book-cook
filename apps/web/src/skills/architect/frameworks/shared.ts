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

export function chapter(
  title: string,
  summary: string,
  targetWords: number,
  sections: {
    kind: string;
    prompt: string;
    share: number;
    beat: string;
  }[],
): FrameworkChapter {
  return {
    title,
    summary,
    target_words: targetWords,
    sections: sections.map((section) => ({
      kind: section.kind,
      prompt: section.prompt,
      target_words: Math.round(targetWords * section.share),
      beat: section.beat,
    })),
  };
}

export function voiceDirection(voiceSummary?: string) {
  return voiceSummary ? ` Voice direction: ${voiceSummary}` : "";
}
