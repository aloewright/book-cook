import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Message({
  role,
  text,
  pending,
}: {
  role: "user" | "assistant" | "tool";
  text: string;
  pending?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div
      className={
        isUser
          ? "ml-auto max-w-[85%] rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          : "max-w-[90%] rounded-lg border bg-white px-3 py-2 text-sm"
      }
    >
      <div className={isUser ? "text-[10px] text-slate-300" : "text-[10px] text-slate-400"}>
        {isUser ? "You" : role === "assistant" ? "Aloysius" : "tool"}
      </div>
      {isUser ? (
        <div className="whitespace-pre-wrap">{text}</div>
      ) : (
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-headings:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {pending ? (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-slate-700 align-baseline" />
          ) : null}
        </div>
      )}
    </div>
  );
}
