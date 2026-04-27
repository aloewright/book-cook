import { useEffect, useRef, useState } from "react";
import { connectAloysius, type AloysiusEvent } from "../../lib/ws";
import { Message } from "./message";

type ChatItem = { role: "user" | "assistant" | "tool"; text: string };

export function AloysiusSidecar({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const sendRef = useRef<((m: object) => void) | null>(null);

  useEffect(() => {
    const conn = connectAloysius(projectId);
    sendRef.current = conn.send;
    const off = conn.onEvent((e: AloysiusEvent) => {
      if (e.type === "assistant_message") {
        setItems((x) => [...x, { role: "assistant", text: e.text }]);
      }
    });
    return () => { off(); conn.ws.close(); };
  }, [projectId]);

  function submit() {
    if (!draft.trim() || !sendRef.current) return;
    setItems((x) => [...x, { role: "user", text: draft }]);
    sendRef.current({ type: "user_message", text: draft });
    setDraft("");
  }

  return (
    <aside className="flex w-[320px] flex-col border-l bg-slate-50">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">Al</span>
        <div>
          <div className="text-sm font-semibold">Aloysius</div>
          <div className="text-[10px] text-slate-500">Editor · always-on</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {items.map((it, i) => (
          <Message key={i} role={it.role} text={it.text} />
        ))}
      </div>
      <div className="border-t p-3">
        <div className="flex gap-2 rounded-md border bg-white px-2 py-1.5">
          <input
            className="flex-1 bg-transparent text-sm focus:outline-none"
            placeholder="Ask Aloysius…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
          <button onClick={submit} className="text-slate-400 hover:text-slate-900">⏎</button>
        </div>
      </div>
    </aside>
  );
}
