import { getAgentByName } from "agents";
import { Hono } from "hono";
import { createAuth } from "./auth";
import { errorHandler } from "./middleware/error";
import { projectsRoute } from "./routes/projects";
import { accountRoute } from "./routes/account";
import { healthRoute } from "./routes/health";
import type { Env } from "./env";

export { BookProjectAgent } from "./agents/aloysius";

const app = new Hono<{ Bindings: Env }>();
app.use("*", errorHandler);

app.route("/api/v1/health", healthRoute);

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/v1/projects", projectsRoute);
app.route("/api/v1/account", accountRoute);

app.get("/agents/aloysius/:projectId", async (c) => {
  if (c.req.header("Upgrade") !== "websocket") {
    return c.text("expected websocket", 426);
  }
  const stub = await getAgentByName(
    c.env.ALOYSIUS,
    c.req.param("projectId")
  );
  return stub.fetch(c.req.raw);
});

// Delegate all unmatched routes to the ASSETS binding so the SPA handles them.
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
