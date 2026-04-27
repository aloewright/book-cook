import { Hono } from "hono";
import type { Env } from "./env";

export { BookProjectAgent } from "./agents/aloysius";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/v1/health", (c) =>
  c.json({ ok: true, env: c.env.ENV, ts: Date.now() })
);

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
