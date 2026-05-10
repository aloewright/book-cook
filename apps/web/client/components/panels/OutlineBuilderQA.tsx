import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { type ChapterPlanInput, type CharacterArcInput, type Project, api } from "../../lib/api";
import { ChoiceCard, FieldChip, Step } from "../studio/wizard";
import { OUTLINE_FRAMEWORKS } from "./_shared";

type StepKey = "framework" | "premise" | "characters" | "scene-plan" | "chapter-plan" | "review";

type ChapterPlanRow = ChapterPlanInput & { _key: string };

export default function OutlineBuilderQA({ project }: { project: Project }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameworks = OUTLINE_FRAMEWORKS.filter((f) => f.type === project.type);
  const [framework, setFramework] = useState<string>(frameworks[0]?.id ?? "");
  const [questionnaire, setQuestionnaire] = useState("");
  const [protagonist, setProtagonist] = useState("");
  const [antagonist, setAntagonist] = useState("");
  const [supporting, setSupporting] = useState("");
  const [defaultCast, setDefaultCast] = useState("");
  const [miniStructure, setMiniStructure] = useState("");
  const [chapterPlan, setChapterPlan] = useState<ChapterPlanRow[]>([
    { _key: crypto.randomUUID(), ordinal: 1, title: "", event: "" },
  ]);

  const generate = useMutation({
    mutationFn: () =>
      api.generateProjectOutline(project.id, {
        framework,
        questionnaire,
        character_arcs: buildCharacterArcs(),
        scene_plan: { defaultCast, miniStructure },
        chapter_plan: chapterPlan.filter((c) => c.event.trim()).map(({ _key, ...rest }) => rest),
      }),
  });

  function buildCharacterArcs(): CharacterArcInput[] {
    const out: CharacterArcInput[] = [];
    if (protagonist.trim())
      out.push({ name: "Protagonist", arc: protagonist.trim(), position: "central" });
    if (antagonist.trim())
      out.push({ name: "Antagonist", arc: antagonist.trim(), position: "opposing" });
    if (supporting.trim())
      out.push({ name: "Supporting", arc: supporting.trim(), position: "supporting" });
    return out;
  }

  function goTo(id: StepKey) {
    const el = document.getElementById(`step-${id}`);
    if (el && containerRef.current) {
      const top =
        el.getBoundingClientRect().top -
        containerRef.current.getBoundingClientRect().top +
        containerRef.current.scrollTop -
        40;
      containerRef.current.scrollTo({ top, behavior: "smooth" });
    }
  }

  const total = 6;
  const canSubmit = questionnaire.trim().length > 8 && framework.length > 0;

  return (
    <div
      className="h-[calc(100vh-7rem)] snap-y snap-mandatory overflow-y-scroll"
      ref={containerRef}
    >
      <Step
        active
        anchorId="step-framework"
        canAdvance={framework.length > 0}
        index={1}
        onNext={() => goTo("premise")}
        subtitle="The framework shapes the chapter rhythm and beats Book Cook will propose."
        title="Pick a framework"
        total={total}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {frameworks.map((f) => (
            <ChoiceCard
              active={framework === f.id}
              key={f.id}
              onClick={() => setFramework(f.id)}
              subtitle={f.description}
              title={f.label}
            />
          ))}
        </div>
      </Step>

      <Step
        anchorId="step-premise"
        canAdvance={questionnaire.trim().length > 8}
        index={2}
        onNext={() => goTo("characters")}
        subtitle="Write it out longhand — what's the book about, what's the promise, what does the reader leave with?"
        title="Your premise"
        total={total}
      >
        <textarea
          className="w-full resize-none bg-transparent font-serif text-xl leading-relaxed outline-none placeholder:text-neutral-400"
          onChange={(e) => setQuestionnaire(e.target.value)}
          placeholder="The protagonist discovers..."
          rows={8}
          value={questionnaire}
        />
      </Step>

      <Step
        anchorId="step-characters"
        canAdvance
        index={3}
        onNext={() => goTo("scene-plan")}
        subtitle={
          project.type === "fiction"
            ? "Sketch a few arcs. Skip any you don't have yet."
            : "Audience first, then the perspectives you'll teach from."
        }
        title={project.type === "fiction" ? "Who's in the story?" : "Who are you writing for?"}
        total={total}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <FieldChip
            label={project.type === "fiction" ? "Protagonist" : "Primary audience"}
            onChange={setProtagonist}
            placeholder={
              project.type === "fiction" ? "A reluctant cartographer…" : "Senior PMs at SaaS cos…"
            }
            value={protagonist}
          />
          <FieldChip
            label={project.type === "fiction" ? "Antagonist" : "Secondary audience"}
            onChange={setAntagonist}
            placeholder=""
            value={antagonist}
          />
          <FieldChip
            label={project.type === "fiction" ? "Supporting" : "Voice or perspective"}
            onChange={setSupporting}
            placeholder=""
            value={supporting}
          />
        </div>
      </Step>

      <Step
        anchorId="step-scene-plan"
        canAdvance
        index={4}
        onNext={() => goTo("chapter-plan")}
        subtitle="Default cast for each scene and a mini-structure to anchor pacing."
        title="Scene plan"
        total={total}
      >
        <div className="space-y-3">
          <FieldChip
            label="Default cast"
            onChange={setDefaultCast}
            placeholder="Mira, Hesperus, the City"
            value={defaultCast}
          />
          <textarea
            className="w-full resize-none bg-transparent font-serif text-base leading-relaxed outline-none placeholder:text-neutral-400"
            onChange={(e) => setMiniStructure(e.target.value)}
            placeholder="Setup → escalating turn → payoff"
            rows={3}
            value={miniStructure}
          />
        </div>
      </Step>

      <Step
        anchorId="step-chapter-plan"
        canAdvance
        index={5}
        onNext={() => goTo("review")}
        subtitle="Optional. Drop in a chapter or two — the rest can be generated."
        title="Chapter plan"
        total={total}
      >
        <ChapterPlanEditor onChange={setChapterPlan} plan={chapterPlan} />
      </Step>

      <Step
        anchorId="step-review"
        canAdvance={canSubmit}
        ctaLabel={generate.isPending ? "Generating…" : "Generate outline"}
        index={6}
        onNext={() => generate.mutate()}
        subtitle="You can edit any answer above by scrolling back up."
        title="Review & generate"
        total={total}
      >
        <ReviewSummary
          antagonist={antagonist}
          chapterCount={chapterPlan.filter((c) => c.event.trim()).length}
          framework={frameworks.find((f) => f.id === framework)?.label ?? framework}
          protagonist={protagonist}
          questionnaire={questionnaire}
          supporting={supporting}
        />
        {generate.error ? (
          <p className="mt-3 text-red-500 text-sm">{generate.error.message}</p>
        ) : null}
      </Step>
    </div>
  );
}

function ChapterPlanEditor({
  plan,
  onChange,
}: {
  plan: ChapterPlanRow[];
  onChange: (next: ChapterPlanRow[]) => void;
}) {
  function update(idx: number, patch: Partial<ChapterPlanInput>) {
    onChange(plan.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }
  function add() {
    onChange([
      ...plan,
      { _key: crypto.randomUUID(), ordinal: plan.length + 1, title: "", event: "" },
    ]);
  }
  function remove(idx: number) {
    onChange(plan.filter((_, i) => i !== idx).map((c, i) => ({ ...c, ordinal: i + 1 })));
  }
  return (
    <div className="space-y-3">
      {plan.map((c, i) => (
        <div
          className="grid grid-cols-1 gap-2 rounded-2xl bg-white/60 p-3 ring-1 ring-black/5 sm:grid-cols-[80px_1fr_1fr] dark:bg-white/5 dark:ring-white/10"
          key={c._key}
        >
          <FieldChip label="#" onChange={() => {}} placeholder="" value={String(c.ordinal)} />
          <FieldChip
            label="Title"
            onChange={(v) => update(i, { title: v })}
            placeholder="Chapter title"
            value={c.title ?? ""}
          />
          <FieldChip
            label="Event"
            onChange={(v) => update(i, { event: v })}
            placeholder="What happens here"
            value={c.event}
          />
          <button
            className="text-neutral-500 text-xs hover:text-red-500"
            onClick={() => remove(i)}
            type="button"
          >
            remove
          </button>
        </div>
      ))}
      <button
        className="rounded-full bg-neutral-950 px-4 py-2 text-neutral-200 text-sm"
        onClick={add}
        type="button"
      >
        + Add chapter
      </button>
    </div>
  );
}

function ReviewSummary(props: {
  framework: string;
  questionnaire: string;
  protagonist: string;
  antagonist: string;
  supporting: string;
  chapterCount: number;
}) {
  return (
    <div className="space-y-2 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5 dark:bg-neutral-900/70 dark:ring-white/5">
      <Row label="Framework" value={props.framework} />
      <Row label="Premise" value={props.questionnaire.slice(0, 120) || "—"} />
      {props.protagonist && <Row label="Protagonist" value={props.protagonist} />}
      {props.antagonist && <Row label="Antagonist" value={props.antagonist} />}
      {props.supporting && <Row label="Supporting" value={props.supporting} />}
      <Row label="Seed chapters" value={String(props.chapterCount)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-28 shrink-0 text-[11px] text-neutral-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="font-serif text-sm">{value}</div>
    </div>
  );
}
