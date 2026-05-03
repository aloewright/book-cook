import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useAgent } from "agents/react";
import { Send, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";

export function AloysiusSidecar({ projectId }: { projectId: string }) {
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
    <aside className="relative z-20 flex h-full w-full min-h-0 flex-col overflow-hidden border-l bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            Al
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Aloysius</div>
            <div className="text-xs text-muted-foreground">Editor · always-on</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-muted-foreground">{connected ? "Live" : "Offline"}</span>
        </div>
      </header>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            Say hi to Aloysius — he'll help you shape your book.
          </div>
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
                className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap"
              >
                {text}
              </div>
            );
          }
          return (
            <Card
              key={m.id}
              className="max-w-[92%] border-border bg-card px-3 py-2 text-card-foreground shadow-none"
            >
              <div className="mb-1 text-xs text-muted-foreground">Aloysius</div>
              <div className="chat-markdown prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-headings:my-2">
                <Streamdown>{text}</Streamdown>
              </div>
            </Card>
          );
        })}

        {status === "submitted" && (
          <Card className="max-w-[92%] border-border bg-card px-3 py-2 text-card-foreground shadow-none">
            <div className="mb-1 text-xs text-muted-foreground">Aloysius</div>
            <div className="flex items-center gap-1 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </Card>
        )}
      </div>

      <div className="shrink-0 border-t bg-background p-2">
        <div className="relative">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? "Aloysius is replying…" : "Ask Aloysius…"}
            disabled={isStreaming}
            rows={1}
            className="resize-none pr-12"
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
          <div className="absolute bottom-2 right-2">
            {isStreaming ? (
              <Button
                size="icon"
                variant="secondary"
                onClick={stop}
                aria-label="Stop"
                className="h-8 w-8"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={submit}
                disabled={!input.trim()}
                aria-label="Send"
                className="h-8 w-8"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
