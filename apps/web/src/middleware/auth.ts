import type { MiddlewareHandler } from "hono";
import { createAuth } from "../auth";
import type { Env } from "../env";

export type AuthVariables = {
  user: { id: string; email: string; plan: "free" | "pro" | "grow" };
};

export const requireUser: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthVariables;
}> = async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    const err = new Error("Unauthorized");
    err.name = "Unauthorized";
    throw err;
  }
  c.set("user", session.user as AuthVariables["user"]);
  await next();
};
