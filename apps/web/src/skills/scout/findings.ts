import type { Env } from "../../env";
import { gateway } from "../../lib/gateway";
import type { MarketDatasetRecord } from "./dataset";

export type ScoutType = "nonfiction" | "fiction";

export type ScoutEvidence = {
  dataset: {
    snapshot_id: string;
    week_iso: string;
    r2_key: string;
    source: string;
  };
  niche: string;
  type: ScoutType;
  records: MarketDatasetRecord[];
  gaps: string[];
  recommendations: string[];
};

export type ScoutFindingDraft = {
  summary_md: string;
  evidence_json: ScoutEvidence;
};

export async function readMarketRecords(
  env: Pick<Env, "R2">,
  r2Key: string,
): Promise<MarketDatasetRecord[]> {
  const object = await env.R2.get(r2Key);
  if (!object) return [];
  return parseMarketRecords(await object.text());
}

export function parseMarketRecords(jsonl: string): MarketDatasetRecord[] {
  return jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Partial<MarketDatasetRecord>)
    .map(normalizeRecord)
    .filter((record): record is MarketDatasetRecord => Boolean(record));
}

export async function synthesizeMarketFinding(
  env: Pick<Env, "AI_GATEWAY_BASE_URL" | "AI_GATEWAY_TOKEN">,
  input: {
    niche: string;
    type: ScoutType;
    records: MarketDatasetRecord[];
    dataset: ScoutEvidence["dataset"];
  },
): Promise<ScoutFindingDraft> {
  const evidence = buildEvidence(input);
  const fallback = renderSummary(evidence);

  if (env.AI_GATEWAY_BASE_URL && env.AI_GATEWAY_TOKEN) {
    try {
      const result = await gateway.chatCompletion(env, {
        route: "dynamic/research_gen",
        temperature: 0.2,
        maxTokens: 900,
        messages: [
          {
            role: "system",
            content:
              "Return concise markdown only. Summarize book-market evidence into positioning gaps and next concept moves. Do not invent titles beyond the provided evidence.",
          },
          {
            role: "user",
            content: JSON.stringify({
              niche: input.niche,
              type: input.type,
              evidence: evidence.records,
              gaps: evidence.gaps,
              recommendations: evidence.recommendations,
            }),
          },
        ],
      });
      const summary = result.text.trim();
      if (summary) return { summary_md: summary, evidence_json: evidence };
    } catch (error) {
      console.warn("scout finding synthesis fell back to deterministic summary", error);
    }
  }

  return { summary_md: fallback, evidence_json: evidence };
}

function buildEvidence(input: {
  niche: string;
  type: ScoutType;
  records: MarketDatasetRecord[];
  dataset: ScoutEvidence["dataset"];
}): ScoutEvidence {
  const records = selectRecords(input.records, input.niche);
  const topKeywords = keywordCounts(records).slice(0, 6);
  const sourceSet = new Set(records.map((record) => record.source));
  const gaps = [
    `${input.type === "fiction" ? "Story" : "Promise"} angles are clustered around ${
      topKeywords
        .slice(0, 3)
        .map(([keyword]) => keyword)
        .join(", ") || "broad reader outcomes"
    }, leaving room for a sharper owned mechanism.`,
    sourceSet.has("library")
      ? "Catalog demand is visible, but the current signals do not show a clear fresh hook."
      : "Library/catalog durability is thin in the current dataset, so validate evergreen demand before scaling.",
    sourceSet.has("trends")
      ? "Search interest is present; package the concept around a specific reader moment rather than the whole category."
      : "Trend signals are sparse; use audience interviews or ads before committing to a narrow promise.",
  ];
  const recommendations = [
    `Lead with a concrete ${input.type === "fiction" ? "reader trope plus emotional payoff" : "reader outcome plus method"} for ${input.niche}.`,
    "Use the highest-signal keywords in subtitle, description, and first-chapter promise language.",
    "Differentiate the table of contents with a gap-focused chapter that competitors are not explicitly naming.",
  ];

  return {
    dataset: input.dataset,
    niche: input.niche,
    type: input.type,
    records,
    gaps,
    recommendations,
  };
}

function selectRecords(records: MarketDatasetRecord[], niche: string) {
  const tokens = tokenize(niche);
  const scored = records
    .map((record) => ({
      record,
      score:
        scoreText(record.niche, tokens) * 3 +
        scoreText(record.title, tokens) * 2 +
        scoreText(record.signal, tokens) +
        record.keywords.reduce((sum, keyword) => sum + scoreText(keyword, tokens), 0),
    }))
    .sort((a, b) => b.score - a.score || a.record.rank - b.record.rank);
  const relevant = scored.filter((item) => item.score > 0).map((item) => item.record);
  return (relevant.length ? relevant : scored.map((item) => item.record)).slice(0, 12);
}

function keywordCounts(records: MarketDatasetRecord[]) {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const keyword of record.keywords) {
      const normalized = keyword.trim().toLowerCase();
      if (normalized.length < 3) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderSummary(evidence: ScoutEvidence) {
  const titleList = evidence.records
    .slice(0, 5)
    .map((record) => `- ${record.title} (${record.source}, rank ${record.rank}): ${record.signal}`)
    .join("\n");
  return [
    `## Scout read: ${evidence.niche}`,
    "",
    "The current market evidence shows a usable demand pattern, but the concept needs a sharper promise and a visible gap before moving into outline.",
    "",
    "### Trending titles and signals",
    titleList,
    "",
    "### Gap analysis",
    ...evidence.gaps.map((gap) => `- ${gap}`),
    "",
    "### Concept moves",
    ...evidence.recommendations.map((item) => `- ${item}`),
  ].join("\n");
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function scoreText(text: string, tokens: string[]) {
  const haystack = text.toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function normalizeRecord(record: Partial<MarketDatasetRecord>): MarketDatasetRecord | null {
  if (!record.title || !record.niche) return null;
  const source =
    record.source === "kdp" || record.source === "trends" || record.source === "library"
      ? record.source
      : "kdp";
  return {
    source,
    niche: String(record.niche),
    title: String(record.title),
    author: record.author ? String(record.author) : "Market aggregate",
    rank: Number.isFinite(record.rank) ? Number(record.rank) : 999,
    signal: record.signal ? String(record.signal) : "market signal",
    keywords: Array.isArray(record.keywords) ? record.keywords.slice(0, 8).map(String) : [],
    observed_at: record.observed_at ? String(record.observed_at) : new Date(0).toISOString(),
  };
}
