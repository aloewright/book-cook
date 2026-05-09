export function BreadcrumbPill({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="-translate-x-1/2 fixed top-4 left-1/2 z-20 flex items-center gap-2 rounded-full bg-neutral-950/90 px-4 py-2 text-neutral-200 text-sm shadow-lg ring-1 ring-white/5 backdrop-blur">
      <span className="font-medium">{title}</span>
      <span className="text-neutral-500">/</span>
      <span className="text-neutral-400">{subtitle}</span>
    </div>
  );
}
