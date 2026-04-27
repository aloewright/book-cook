import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

export const errorHandler: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  try {
    await next();
  } catch (err) {
    const e = err as Error;
    const code =
      e.name === "BudgetExceeded"
        ? 402
        : e.name === "Unauthorized"
          ? 401
          : 500;
    console.error("error", e.name, e.message);
    return c.json({ error: { code: e.name, message: e.message } }, code);
  }
};
