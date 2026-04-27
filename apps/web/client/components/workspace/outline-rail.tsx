const MODES = [
  { key: "concept", label: "Concept", icon: "◷" },
  { key: "voice", label: "Voice", icon: "🎤" },
  { key: "outline", label: "Outline", icon: "🗂" },
  { key: "chapters", label: "Chapters", icon: "✏️" },
  { key: "publish", label: "Publish", icon: "📦" },
  { key: "launch", label: "Launch", icon: "🚀" },
] as const;

export function OutlineRail({ active = "concept" }: { active?: typeof MODES[number]["key"] }) {
  return (
    <aside className="w-[200px] border-r bg-slate-50 p-3 text-sm">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</div>
      {MODES.map((m) => (
        <div
          key={m.key}
          className={
            "rounded px-2 py-1.5 " +
            (active === m.key ? "bg-slate-900 font-semibold text-white" : "text-slate-600")
          }
        >
          <span className="mr-2">{m.icon}</span>{m.label}
        </div>
      ))}
    </aside>
  );
}
