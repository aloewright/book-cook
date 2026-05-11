import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useAgent } from "agents/react";
import { Send, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";

export function EditorialAssistantSidecar({ projectId }: { projectId: string }) {
  const agent = useAgent({ agent: "aloysius", name: projectId });
  const { messages, sendMessage, status, stop } = useAgentChat({ agent });
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const smoothScrollReady = useRef(false);

  const isStreaming = status === "streaming" || status === "submitted";

  const messageScrollKey = useMemo(
    () =>
      messages
        .map((message) => {
          const textLength = message.parts
            .filter((part): part is { type: "text"; text: string } => part.type === "text")
            .reduce((sum, part) => sum + part.text.length, 0);
          return `${message.id}:${textLength}`;
        })
        .join("|"),
    [messages],
  );

  useEffect(() => {
    const sock = agent as unknown as WebSocket;
    if (!sock || typeof sock.addEventListener !== "function") return;
    const update = () => setConnected(sock.readyState === WebSocket.OPEN);
    update();
    sock.addEventListener("open", update);
    sock.addEventListener("close", update);
    return () => {
      sock.removeEventListener("open", update);
      sock.removeEventListener("close", update);
    };
  }, [agent]);

  useEffect(() => {
    void messageScrollKey;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: smoothScrollReady.current ? "smooth" : "auto",
    });
    if (smoothScrollReady.current) return;
    const id = window.setTimeout(() => {
      smoothScrollReady.current = true;
    }, 250);
    return () => window.clearTimeout(id);
  }, [messageScrollKey]);

  function submit() {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center font-serif text-neutral-500 text-sm leading-relaxed">
            Ask anything about your book — craft, structure, character, voice.
          </p>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          const text = m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");
          if (isUser) {
            return (
              <div
                key={m.id}
                className="ml-auto max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-neutral-200 text-sm whitespace-pre-wrap"
              >
                {text}
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className="max-w-[92%] font-serif text-neutral-300 text-sm leading-relaxed"
            >
              <Streamdown>{text}</Streamdown>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex items-center gap-1 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/5 p-3">
        <div className="relative">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? "Replying…" : "Ask anything…"}
            disabled={isStreaming}
            rows={1}
            className="w-full resize-none rounded-xl bg-white/5 px-3 py-2 pr-10 text-neutral-200 text-sm outline-none placeholder:text-neutral-500 transition focus:bg-white/8"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            onInput={(e) => {
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
            }}
          />
          <div className="absolute right-2 bottom-2">
            {isStreaming ? (
              <button
                aria-label="Stop"
                className="grid size-6 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                onClick={stop}
                type="button"
              >
                <Square className="size-3" />
              </button>
            ) : (
              <button
                aria-label="Send"
                className="grid size-6 place-items-center rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40"
                disabled={!input.trim()}
                onClick={submit}
                type="button"
              >
                <Send className="size-3" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-neutral-600"}`}
          />
          <span className="text-[10px] text-neutral-500">
            {connected ? "Connected" : "Connecting…"}
          </span>
        </div>
      </div>
    </div>
  );
}
