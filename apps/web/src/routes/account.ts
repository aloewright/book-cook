import { Hono } from "hono";
import { requireUser, type AuthVariables } from "../middleware/auth";
import type { Env } from "../env";

export const accountRoute = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

accountRoute.use("*", requireUser);

accountRoute.get("/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
