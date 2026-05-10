import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DynamicIslandTOC } from "../components/studio/dynamic-toc";
import { ChoiceCard, FieldChip, Step } from "../components/studio/wizard";
import { api } from "../lib/api";

export const Route = createFileRoute("/studio/compose")({ component: Compose });

type StepKey = "title" | "type" | "logline" | "audience" | "voice" | "review";

const STEPS: { id: StepKey; label: string }[] = [
  { id: "title", label: "Working title" },
  { id: "type", label: "Fiction or nonfiction" },
  { id: "logline", label: "Your story in one sentence" },
  { id: "audience", label: "Who is this for" },
  { id: "voice", label: "Voice & tone" },
  { id: "review", label: "Review & start" },
];

function Compose() {
  const nav = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"fiction" | "nonfiction">("fiction");
  const [logline, setLogline] = useState("");
  const [protagonist, setProtagonist] = useState("");
  const [conflict, setConflict] = useState("");
  const [stakes, setStakes] = useState("");
  const [audience, setAudience] = useState("");
  const [voice, setVoice] = useState("");
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    setContainer(containerRef.current);
  }, []);

  const composed = useMemo(() => logline.trim(), [logline]);

  const generate = useMutation({
    mutationFn: () => api.generateLogline({ protagonist, conflict, stakes, type }),
    onSuccess: ({ logline: generated }) => {
      setLogline(generated);
      setGenError(null);
    },
    onError: (err: unknown) => {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    },
  });

  const hasSeed = protagonist.trim().length + conflict.trim().length + stakes.trim().length > 0;
  const canGenerate = hasSeed && !generate.isPending;

  const create = useMutation({
    mutationFn: api.createProject,
    onSuccess: ({ id }) => {
      nav({
        to: "/studio/$projectId",
        params: { projectId: id },
        search: { logline: composed },
      });
    },
  });

  const goNext = (id: StepKey) => {
    const idx = STEPS.findIndex((s) => s.id === id);
    const next = STEPS[idx + 1];
    if (!next) return;
    const el = document.getElementById(`step-${next.id}`);
    if (el && containerRef.current) {
      const top =
        el.getBoundingClientRect().top -
        containerRef.current.getBoundingClientRect().top +
        containerRef.current.scrollTop -
        40;
      containerRef.current.scrollTo({ top, behavior: "smooth" });
    }
  };

  const canSubmit = title.trim().length > 0 && composed.length > 8;

  return (
    <div
      className="h-[calc(100vh-3.5rem)] snap-y snap-mandatory overflow-y-scroll bg-[#efece2] text-neutral-900 dark:bg-[#1a1a1a] dark:text-neutral-100"
      ref={containerRef}
    >
      <DynamicIslandTOC scrollContainer={container} selector="[data-toc]" />

      <Step
        active
        anchorId="step-title"
        index={1}
        total={STEPS.length}
        onNext={() => goNext("title")}
        canAdvance={title.trim().length > 0}
        title="What's the working title?"
        subtitle="You can change it any time."
      >
        <input
          className="w-full bg-transparent font-serif text-3xl outline-none placeholder:text-neutral-400"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) goNext("title");
          }}
          placeholder="Untitled book"
          ref={(el) => el?.focus()}
          value={title}
        />
      </Step>

      <Step
        anchorId="step-type"
        index={2}
        total={STEPS.length}
        onNext={() => goNext("type")}
        canAdvance
        title="Fiction or nonfiction?"
        subtitle="Sets the framework Book Cook proposes next."
      >
        <div className="flex gap-3">
          <ChoiceCard
            active={type === "fiction"}
            onClick={() => setType("fiction")}
            title="Fiction"
            subtitle="Story, characters, scenes"
          />
          <ChoiceCard
            active={type === "nonfiction"}
            onClick={() => setType("nonfiction")}
            title="Nonfiction"
            subtitle="Argument, evidence, chapters"
          />
        </div>
      </Step>

      <Step
        anchorId="step-logline"
        index={3}
        total={STEPS.length}
        onNext={() => goNext("logline")}
        canAdvance={composed.length > 8}
        title="Your story, in one sentence."
        subtitle="Fill the structure to generate one — or just write your own below."
      >
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <FieldChip
            label="Protagonist"
            onChange={setProtagonist}
            placeholder="A reluctant cartographer"
            value={protagonist}
          />
          <FieldChip
            label="Conflict"
            onChange={setConflict}
            placeholder="must map a shifting city"
            value={conflict}
          />
          <FieldChip
            label="Stakes"
            onChange={setStakes}
            placeholder="before home erases her"
            value={stakes}
          />
        </div>
        <div className="mb-3 flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-full bg-neutral-950/90 px-3 py-1.5 text-neutral-200 text-sm hover:bg-neutral-800 disabled:opacity-50"
            disabled={!canGenerate}
            onClick={() => generate.mutate()}
            type="button"
          >
            <Wand2 className="size-3.5" />
            {generate.isPending ? "Generating…" : "Generate logline"}
          </button>
          {!hasSeed && (
            <span className="text-neutral-500 text-xs">Fill any field above first.</span>
          )}
          {genError && <span className="text-red-500 text-xs">{genError}</span>}
        </div>
        <textarea
          className="w-full resize-none bg-transparent font-serif text-2xl leading-relaxed outline-none placeholder:text-neutral-400"
          onChange={(e) => setLogline(e.target.value)}
          placeholder="A reluctant cartographer must map a city that rearranges itself each night, before home erases her too."
          rows={4}
          value={logline}
        />
      </Step>

      <Step
        anchorId="step-audience"
        index={4}
        total={STEPS.length}
        onNext={() => goNext("audience")}
        canAdvance
        title="Who is this for?"
        subtitle="Optional. Skip if you don't know yet."
      >
        <input
          className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-neutral-400"
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Readers who loved Piranesi and The City & The City."
          value={audience}
        />
      </Step>

      <Step
        anchorId="step-voice"
        index={5}
        total={STEPS.length}
        onNext={() => goNext("voice")}
        canAdvance
        title="Voice & tone"
        subtitle="A few words is plenty. We'll match it later from the voice library."
      >
        <input
          className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-neutral-400"
          onChange={(e) => setVoice(e.target.value)}
          placeholder="Spare. Lyrical. Quiet menace."
          value={voice}
        />
      </Step>

      <Step
        anchorId="step-review"
        index={6}
        total={STEPS.length}
        onNext={() => create.mutate({ title: title.trim(), type })}
        canAdvance={canSubmit}
        title="Review & start"
        subtitle="You can edit everything inside the canvas."
        ctaLabel={create.isPending ? "Creating…" : "Open canvas"}
      >
        <div className="space-y-3 rounded-2xl bg-white/70 p-5 ring-1 ring-black/5 dark:bg-neutral-900/70 dark:ring-white/5">
          <ReviewRow label="Title" value={title || "—"} />
          <ReviewRow label="Type" value={type} />
          <ReviewRow label="Logline" value={composed || "—"} />
          {audience && <ReviewRow label="Audience" value={audience} />}
          {voice && <ReviewRow label="Voice" value={voice} />}
        </div>
      </Step>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 shrink-0 text-[11px] text-neutral-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="font-serif text-base">{value}</div>
    </div>
  );
}
