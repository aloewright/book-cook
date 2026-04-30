import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.use("*", async (c, next) => {
  const token = c.req.header("X-Internal-Token");
  if (token !== process.env.RENDER_WORKER_INTERNAL_TOKEN) return c.text("forbidden", 403);
  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "render-worker", ts: Date.now() }));

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
serve({ fetch: app.fetch, port });
console.log(`render-worker listening on :${port}`);
