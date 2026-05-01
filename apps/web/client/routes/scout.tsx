import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { type ScoutResult, api, queryKeys } from "../lib/api";

export const Route = createFileRoute("/scout")({ component: ScoutPage });

function ScoutPage() {
  const queryClient = useQueryClient();
  const [niche, setNiche] = useState("productivity systems for neurodivergent founders");
  const [type, setType] = useState<"nonfiction" | "fiction">("nonfiction");
  const [active, setActive] = useState<ScoutResult | null>(null);
  const queries = useQuery({ queryKey: queryKeys.scoutQueries(), queryFn: api.listScoutQueries });
  const create = useMutation({
    mutationFn: () => api.createScoutQuery({ niche, type }),
    onSuccess: async (result) => {
      setActive(result);
      await queryClient.invalidateQueries({ queryKey: queryKeys.scoutQueries() });
    },
  });
  const result = active ?? queries.data?.items[0] ?? null;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold">Scout</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Run a market read before committing a concept. Scout stores the query, dataset evidence,
            and gap analysis for later project use.
          </p>
        </div>
        <Badge variant="secondary">Market dataset</Badge>
      </div>

      <form
        className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[1fr_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (niche.trim()) create.mutate();
        }}
      >
        <Input
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          placeholder="Niche or reader demand"
        />
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nonfiction">Nonfiction</SelectItem>
            <SelectItem value="fiction">Fiction</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!niche.trim() || create.isPending}>
          <Search className="h-4 w-4" />
          {create.isPending ? "Scouting..." : "Run Scout"}
        </Button>
        {create.error ? (
          <p className="text-sm text-destructive md:col-span-3">{create.error.message}</p>
        ) : null}
      </form>

      {result ? (
        <ScoutResultView result={result} />
      ) : (
        <EmptyScoutState loading={queries.isLoading} />
      )}

      {(queries.data?.items.length ?? 0) > 1 ? (
        <section className="border-t pt-6">
          <h2 className="text-lg font-semibold">Recent reads</h2>
          <div className="mt-3 grid gap-2">
            {queries.data?.items.map((item) => (
              <button
                type="button"
                key={item.query.id}
                className="rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-accent"
                onClick={() => setActive(item)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.query.niche}</span>
                  <Badge variant="secondary">{item.query.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.query.created_at)} ·{" "}
                  {item.finding.evidence_json.dataset.week_iso}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

export function ScoutResultView({ result }: { result: ScoutResult }) {
  const [tab, setTab] = useState<"summary" | "risks" | "comps" | "actions">("summary");
  const evidence = result.finding.evidence_json;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0 p-5 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{result.query.niche}</h2>
            <p className="text-sm text-muted-foreground">
              {evidence.dataset.week_iso} · {evidence.records.length} evidence rows
            </p>
          </div>
          <Badge>{result.query.type}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-b pb-3">
          {[
            ["summary", "Summary"],
            ["risks", "Risks"],
            ["comps", "Comparable titles"],
            ["actions", "Action items"],
          ].map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={tab === value ? "default" : "ghost"}
              onClick={() => setTab(value as typeof tab)}
            >
              {label}
            </Button>
          ))}
        </div>
        {tab === "summary" ? (
          <div className="prose prose-neutral prose-sm mt-4 max-w-none dark:prose-invert">
            <ReactMarkdown>{result.finding.summary_md}</ReactMarkdown>
          </div>
        ) : null}
        {tab === "risks" ? (
          <ScoutList
            items={evidence.gaps}
            empty="No gaps were found in this Scout read."
            label="Market and positioning risks"
          />
        ) : null}
        {tab === "comps" ? <ComparableTitleList result={result} /> : null}
        {tab === "actions" ? (
          <ScoutList
            items={evidence.recommendations}
            empty="No action items were generated for this Scout read."
            label="Recommended next moves"
          />
        ) : null}
      </Card>

      <aside>
        <Card className="p-4 shadow-none">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Gap analysis</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {evidence.gaps.slice(0, 4).map((gap) => (
              <li key={gap} className="rounded-md bg-muted/40 p-3">
                {gap}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Action items</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {evidence.recommendations.slice(0, 3).map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </Card>
      </aside>

      <section className="lg:col-span-2">
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Signal</th>
                <th className="px-3 py-2">Keywords</th>
              </tr>
            </thead>
            <tbody>
              {evidence.records.map((record) => (
                <tr key={`${record.source}-${record.rank}-${record.title}`} className="border-b">
                  <td className="px-3 py-3 font-medium">{record.rank}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{record.title}</div>
                    <div className="text-xs text-muted-foreground">{record.author}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="secondary">{record.source}</Badge>
                  </td>
                  <td className="max-w-sm px-3 py-3 text-muted-foreground">{record.signal}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ScoutList({
  items,
  empty,
  label,
}: {
  items: string[];
  empty: string;
  label: string;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">{label}</h3>
      {items.length ? (
        <div className="mt-3 grid gap-3">
          {items.map((item) => (
            <div key={item} className="rounded-md border bg-muted/20 p-3 text-sm">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function ComparableTitleList({ result }: { result: ScoutResult }) {
  const records = result.finding.evidence_json.records.slice(0, 6);
  return (
    <div className="mt-4 grid gap-3">
      {records.map((record) => (
        <div
          key={`${record.source}-${record.rank}-${record.title}`}
          className="rounded-md border p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">{record.title}</h3>
            <Badge variant="secondary">{record.source}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{record.author}</p>
          <p className="mt-3 text-sm">{record.signal}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyScoutState({ loading }: { loading: boolean }) {
  return (
    <Card className="border-dashed p-8 text-center text-muted-foreground shadow-none">
      {loading ? "Loading market reads..." : "Run Scout to see title signals and gap analysis."}
    </Card>
  );
}

function formatDate(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
