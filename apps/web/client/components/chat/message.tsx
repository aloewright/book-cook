export function Message({ role, text }: { role: "user" | "assistant" | "tool"; text: string }) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
        <div className="text-[10px] text-slate-300">You</div>
        <div>{text}</div>
      </div>
    );
  }
  return (
    <div className="max-w-[90%] rounded-lg border bg-white px-3 py-2 text-sm">
      <div className="text-[10px] text-slate-400">{role === "assistant" ? "Aloysius" : "tool"}</div>
      <div>{text}</div>
    </div>
  );
}
