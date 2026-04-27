import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("aloysius DO", () => {
  it("WebSocket connects and echoes a message back", async () => {
    const id = crypto.randomUUID();
    const res = await SELF.fetch(`http://x/agents/aloysius/${id}`, {
      headers: { Upgrade: "websocket" },
    });
    expect(res.status).toBe(101);
    const ws = res.webSocket;
    if (!ws) throw new Error("missing webSocket on response");
    ws.accept();

    const got = await new Promise<string>((resolve) => {
      ws.addEventListener("message", (e) => {
        const parsed = JSON.parse(String(e.data)) as { type: string };
        if (parsed.type === "assistant_message") resolve(String(e.data));
      });
      ws.send(JSON.stringify({ type: "user_message", text: "hello" }));
    });

    const msg = JSON.parse(got);
    expect(msg.type).toBe("assistant_message");
    expect(msg.text).toContain("hello"); // echo stub
  });
});
