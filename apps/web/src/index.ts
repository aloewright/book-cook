import { Hono } from "hono";
import { createAuth } from "./auth";
import type { Env } from "./env";

export { BookProjectAgent } from "./agents/aloysius";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/v1/health", (c) =>
  c.json({ ok: true, env: c.env.ENV, ts: Date.now() })
);

// Better Auth catch-all
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
