import { Agent } from "agents";
import type { Env } from "../env";

type IncomingMessage =
  | { type: "user_message"; text: string }
  | { type: "ping" };

// Agent's generic constrains Env to Cloudflare.Env, whose ENV literal is
// narrowed to "dev". We treat our broadened Env as the runtime shape.
export class BookProjectAgent extends Agent<Env & { ENV: "dev" }> {
  async onConnect(ws: WebSocket): Promise<void> {
    ws.send(JSON.stringify({ type: "hello", from: "aloysius" }));
  }

  async onMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const msg = JSON.parse(
      typeof raw === "string" ? raw : new TextDecoder().decode(raw)
    ) as IncomingMessage;
    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (msg.type === "user_message") {
      // Phase 1 stub: echo with framing. Skill-routing wires up in Phase 2+.
      ws.send(
        JSON.stringify({
          type: "assistant_message",
          text: `Aloysius (stub): heard "${msg.text}"`,
        })
      );
    }
  }

  async notifyJobStatus(_jobId: string): Promise<void> {
    // Stub. Wired up in Publisher phase.
  }
}
