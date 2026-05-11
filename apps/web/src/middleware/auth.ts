import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { MiddlewareHandler } from "hono";
import { createAuth } from "../auth";
import { users } from "../db/schema";
import type { Env } from "../env";

export type AuthVariables = {
  user: { id: string; email: string; plan: "free" | "pro"; is_admin?: boolean };
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

export const requireAdmin: MiddlewareHandler<{
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
  const db = drizzle(c.env.DB);
  const row = await db
    .select({ is_admin: users.is_admin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!row[0]?.is_admin) {
    const err = new Error("Forbidden");
    err.name = "Forbidden";
    throw err;
  }
  c.set("user", { ...(session.user as AuthVariables["user"]), is_admin: true });
  await next();
};
