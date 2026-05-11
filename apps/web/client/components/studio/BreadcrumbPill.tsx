import { useEffect, useState } from "react";

const TIMER_SECONDS = 25 * 60;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function localTime() {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function BreadcrumbPill({ title }: { title: string }) {
  const [remaining, setRemaining] = useState(TIMER_SECONDS);
  const [time, setTime] = useState(localTime);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
      setTime(localTime());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timerColor =
    remaining <= 60 ? "text-red-400" : remaining <= 5 * 60 ? "text-amber-400" : "text-neutral-400";

  return (
    <div className="-translate-x-1/2 fixed top-4 left-1/2 z-20 flex items-center gap-2 rounded-full bg-neutral-950/90 px-4 py-2 text-neutral-200 text-sm shadow-lg ring-1 ring-white/5 backdrop-blur">
      <span className="font-medium">{title}</span>
      <span className="text-neutral-600">·</span>
      <span className={`font-mono tabular-nums ${timerColor}`}>{fmt(remaining)}</span>
      <span className="text-neutral-600">·</span>
      <span className="text-neutral-400 tabular-nums">{time}</span>
    </div>
  );
}
