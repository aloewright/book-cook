import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function Step({
  index,
  total,
  title,
  subtitle,
  children,
  onNext,
  canAdvance,
  anchorId,
  active,
  ctaLabel = "Continue",
}: {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  canAdvance: boolean;
  anchorId: string;
  active?: boolean;
  ctaLabel?: string;
}) {
  return (
    <section
      className="flex h-[calc(100vh-3.5rem)] snap-start flex-col items-center justify-center px-6"
      id={anchorId}
    >
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center gap-2 text-neutral-500 text-sm">
          <Sparkles className="size-3.5" />
          <span>
            Step {index} of {total}
          </span>
        </div>
        <h2
          className="mb-2 font-serif text-4xl tracking-tight"
          data-toc
          data-toc-depth="2"
          data-toc-title={title}
        >
          {title}
        </h2>
        {subtitle && <p className="mb-6 text-neutral-500">{subtitle}</p>}
        <AnimatePresence initial={false}>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            initial={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-medium text-sm text-white shadow hover:bg-emerald-500 disabled:opacity-40"
            disabled={!canAdvance}
            onClick={onNext}
            type="button"
          >
            {ctaLabel}
            {ctaLabel === "Continue" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
          </button>
          <span className="text-neutral-400 text-xs">press Enter</span>
        </div>
      </div>
    </section>
  );
}

export function ChoiceCard({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex-1 rounded-2xl border p-5 text-left transition ${
        active
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-black/10 bg-white/60 hover:bg-white/90 dark:border-white/10 dark:bg-white/5"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="font-serif text-xl">{title}</div>
      <div className="mt-1 text-neutral-500 text-sm">{subtitle}</div>
    </button>
  );
}

export function FieldChip({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl bg-neutral-100/60 px-3 py-2 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
      <span className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</span>
      <input
        className="bg-transparent text-sm outline-none placeholder:text-neutral-400"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
