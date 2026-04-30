import type { Env } from "../env";
import { gateway } from "../lib/gateway";

export type SectionDraftInput = {
  projectTitle: string;
  projectType: "nonfiction" | "fiction";
  chapterTitle: string;
  chapterSummary: string;
  kind: string;
  prompt: string;
  voiceProfile?: unknown;
  previousDraft?: string;
};

export type SectionDraftResult = {
  markdown: string;
  llm_response: {
    route: "dynamic/text_gen" | "deterministic/local";
    model?: string;
    tokens_in: number;
    tokens_out: number;
  };
};

export async function draftSection(
  env: Pick<Env, "AI_GATEWAY_BASE_URL" | "AI_GATEWAY_TOKEN">,
  input: SectionDraftInput,
): Promise<SectionDraftResult> {
  if (!env.AI_GATEWAY_BASE_URL || !env.AI_GATEWAY_TOKEN) {
    return deterministicDraft(input);
  }

  const result = await gateway.chatCompletion(env, {
    route: "dynamic/text_gen",
    temperature: 0.55,
    maxTokens: 1400,
    messages: [
      {
        role: "system",
        content:
          "You draft one book section at a time. Return polished markdown only. Do not include commentary, JSON, or code fences.",
      },
      {
        role: "user",
        content: [
          `Book: ${input.projectTitle} (${input.projectType})`,
          `Chapter: ${input.chapterTitle}`,
          `Chapter summary: ${input.chapterSummary || "No summary supplied."}`,
          `Section kind: ${input.kind}`,
          `Section prompt: ${input.prompt || "Draft the next coherent section."}`,
          input.voiceProfile
            ? `Voice profile JSON: ${JSON.stringify(input.voiceProfile).slice(0, 6000)}`
            : "",
          input.previousDraft ? `Existing section draft to improve:\n${input.previousDraft}` : "",
          "Draft 350-650 words with strong continuity and concrete details.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const markdown = normalizeDraft(result.text);
  return {
    markdown: markdown || deterministicDraft(input).markdown,
    llm_response: {
      route: "dynamic/text_gen",
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
    },
  };
}

function deterministicDraft(input: SectionDraftInput): SectionDraftResult {
  const prompt = input.prompt || input.chapterSummary || "Build the next useful section.";
  const markdown = normalizeDraft(`## ${titleCase(input.kind)}

${input.chapterTitle} needs a section that turns the promise of the chapter into usable momentum. ${prompt}

Start with a concrete moment: the reader is facing the cost of the old pattern and needs a cleaner way forward. Name the tension plainly, then show the practical shift that resolves it.

- Establish the immediate problem in the reader's own language.
- Show the new move with one specific example.
- Close by connecting the section back to the chapter promise: ${input.chapterSummary || input.chapterTitle}.`);

  return {
    markdown,
    llm_response: {
      route: "deterministic/local",
      tokens_in: countWords(prompt),
      tokens_out: countWords(markdown),
    },
  };
}

function normalizeDraft(text: string) {
  return text
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function countWords(text: string) {
  return text.trim().match(/\b[\w'-]+\b/g)?.length ?? 0;
}
