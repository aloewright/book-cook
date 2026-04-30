import * as Sentry from "@sentry/cloudflare";
import { routeAgentRequest } from "agents";
import { Hono } from "hono";
import { createAuth } from "./auth";
import { RenderWorkerContainer } from "./containers/render-worker";
import type { Env } from "./env";
import { errorHandler } from "./middleware/error";
import { accountRoute } from "./routes/account";
import { chaptersRoute } from "./routes/chapters";
import { healthRoute } from "./routes/health";
import { projectsRoute } from "./routes/projects";
import { scoutRoute } from "./routes/scout";
import { voicesRoute } from "./routes/voices";
import { refreshMarketDataset } from "./skills/scout/dataset";
import { AudiobookMasteringWorkflow } from "./workflows/audiobook-mastering";
import { BookExportWorkflow } from "./workflows/book-export";

export { BookProjectAgent } from "./agents/aloysius";
export { RenderWorkerContainer };
export { BookExportWorkflow };
export { AudiobookMasteringWorkflow };

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  const e = err as Error;
  const code = e.name === "BudgetExceeded" ? 402 : e.name === "Unauthorized" ? 401 : 500;
  console.error("error", e.name, e.message);
  if (e.name !== "Unauthorized" && e.name !== "BudgetExceeded") {
    Sentry.captureException(e);
  }
  return c.json({ error: { code: e.name, message: e.message } }, code);
});

app.route("/api/v1/health", healthRoute);

// Intercept Better Auth's error endpoint so we can show the error to the user
app.get("/api/auth/error", (c) => {
  const url = new URL(c.req.url);
  const err = url.searchParams.get("error") ?? "unknown";
  console.error(`[auth] /api/auth/error hit: ${err}`);
  Sentry.captureMessage(`better-auth /api/auth/error: ${err}`, {
    level: "error",
    tags: { component: "better-auth-error-page", error: err },
  });
  return c.redirect(`/sign-in?error=${encodeURIComponent(err)}`);
});

app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  const url = new URL(c.req.url);
  console.log(`[auth] ${c.req.method} ${url.pathname}${url.search}`);
  console.log(`[auth] cookies: ${(c.req.header("cookie") ?? "(none)").slice(0, 200)}`);
  try {
    const res = await auth.handler(c.req.raw);
    const loc = res.headers.get("location") ?? "";
    console.log(`[auth] response: ${res.status} ${loc}`);
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) console.log(`[auth] set-cookie: ${setCookie.slice(0, 300)}`);
    // Capture Better Auth error redirects to Sentry with full context
    if (loc.includes("/api/auth/error") || loc.includes("error=")) {
      const errMatch = loc.match(/[?&]error=([^&]+)/);
      const betterAuthError = errMatch ? decodeURIComponent(errMatch[1]) : "unknown";
      console.error(`[auth] Better Auth ERROR: ${betterAuthError} (path: ${url.pathname})`);
      Sentry.captureMessage(`better-auth error: ${betterAuthError}`, {
        level: "error",
        tags: { component: "better-auth", path: url.pathname, betterAuthError },
        extra: { fullLocation: loc, requestUrl: c.req.url, method: c.req.method },
      });
    }
    return res;
  } catch (err) {
    const e = err as Error;
    console.error(`[auth] ERROR ${e.name}: ${e.message}\n${e.stack}`);
    Sentry.captureException(e, { tags: { component: "auth-handler", path: url.pathname } });
    throw err;
  }
});

app.get("/api/v1/debug-session", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const cookies = c.req.header("cookie") ?? "(none)";
  return c.json({ session, cookieHeader: cookies.slice(0, 300) });
});

app.route("/api/v1/projects", projectsRoute);
app.route("/api/v1/chapters", chaptersRoute);
app.route("/api/v1/voices", voicesRoute);
app.route("/api/v1/account", accountRoute);
app.route("/api/v1/scout", scoutRoute);

app.all("/agents/*", async (c) => {
  const res = await routeAgentRequest(c.req.raw, c.env);
  return res ?? c.text("not found", 404);
});

// Delegate all unmatched routes to the ASSETS binding so the SPA handles them.
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

const handler: ExportedHandler<Env> = {
  fetch: app.fetch,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refreshMarketDataset(env));
  },
};

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: (env as { SENTRY_DSN?: string }).SENTRY_DSN,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: env.ENV,
  }),
  handler,
);
