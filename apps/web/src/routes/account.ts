import { Hono } from "hono";
import type { Env } from "../env";
import { type AuthVariables, requireUser } from "../middleware/auth";

export const accountRoute = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

accountRoute.use("*", requireUser);

accountRoute.get("/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
