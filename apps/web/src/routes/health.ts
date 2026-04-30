import { getContainer } from "@cloudflare/containers";
import type { Container } from "@cloudflare/containers";
import { Hono } from "hono";
import type { Env } from "../env";

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get("/", (c) => c.json({ ok: true, env: c.env.ENV, ts: Date.now() }));

healthRoute.get("/render", async (c) => {
  if (!c.env.RENDER_WORKER) return c.json({ ok: false, reason: "no binding (local dev)" }, 503);
  const binding = c.env.RENDER_WORKER as unknown as DurableObjectNamespace<Container>;
  const container = getContainer(binding);
  const res = await container.fetch("http://render/health", {
    headers: { "X-Internal-Token": c.env.RENDER_WORKER_INTERNAL_TOKEN ?? "" },
  });
  return c.json({ ok: res.ok, status: res.status });
});
