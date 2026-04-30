import { describe, expect, it } from "vitest";
import {
  parseMarketRecords,
  synthesizeMarketFinding,
} from "../../apps/web/src/skills/scout/findings";

describe("scout findings", () => {
  it("parses JSONL records and builds deterministic evidence", async () => {
    const records = parseMarketRecords(
      [
        JSON.stringify({
          source: "kdp",
          niche: "cozy fantasy mysteries",
          title: "Moonlit Bookshop Murder",
          author: "Market aggregate",
          rank: 1,
          signal: "bestseller pattern around low-stakes mystery with magic",
          keywords: ["cozy", "fantasy", "mystery"],
          observed_at: "2026-04-30T00:00:00.000Z",
        }),
        JSON.stringify({
          source: "trends",
          niche: "cozy fantasy mysteries",
          title: "Trend signal: magical amateur sleuths",
          author: "Market aggregate",
          rank: 2,
          signal: "search interest around whimsical clues",
          keywords: ["sleuth", "magic", "bookshop"],
          observed_at: "2026-04-30T00:00:00.000Z",
        }),
      ].join("\n"),
    );

    const result = await synthesizeMarketFinding(
      { AI_GATEWAY_BASE_URL: undefined, AI_GATEWAY_TOKEN: undefined },
      {
        niche: "cozy fantasy mysteries",
        type: "fiction",
        records,
        dataset: {
          snapshot_id: "snapshot-1",
          week_iso: "2026-W18",
          r2_key: "datasets/2026-W18/raw.jsonl",
          source: "test",
        },
      },
    );

    expect(result.summary_md).toContain("Scout read: cozy fantasy mysteries");
    expect(result.evidence_json.records).toHaveLength(2);
    expect(result.evidence_json.gaps).toHaveLength(3);
    expect(result.evidence_json.recommendations[0]).toContain("reader trope");
  });
});
