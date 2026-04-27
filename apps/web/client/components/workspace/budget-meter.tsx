export function BudgetMeter({ spentCents, capCents }: { spentCents: number; capCents: number }) {
  const pct = Math.min(100, Math.round((spentCents / Math.max(1, capCents)) * 100));
  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600" title={`${dollars(spentCents)} of ${dollars(capCents)} today`}>
      <span>{dollars(spentCents)} today</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
