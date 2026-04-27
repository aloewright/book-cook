import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { projects } from "../db/schema";
import { requireUser, type AuthVariables } from "../middleware/auth";
import type { Env } from "../env";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["nonfiction", "fiction"]),
  genre: z.string().optional(),
  target_word_count: z.number().int().min(5000).max(200000).optional(),
});

export const projectsRoute = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

projectsRoute.use("*", requireUser);

projectsRoute.get("/", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB);
  const items = await db
    .select()
    .from(projects)
    .where(and(eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .orderBy(desc(projects.updated_at));
  return c.json({ items });
});

projectsRoute.post("/", async (c) => {
  const user = c.get("user");
  const body = createSchema.parse(await c.req.json());
  const id = crypto.randomUUID();
  const db = drizzle(c.env.DB);
  await db.insert(projects).values({
    id,
    user_id: user.id,
    title: body.title,
    type: body.type,
    genre: body.genre,
    target_word_count:
      body.target_word_count ?? (body.type === "nonfiction" ? 50000 : 75000),
  });
  return c.json({ id }, 201);
});

projectsRoute.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.user_id, user.id),
        isNull(projects.deleted_at)
      )
    )
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);
  return c.json(p);
});

projectsRoute.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  await db
    .update(projects)
    .set({ deleted_at: new Date() })
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id)));
  return new Response(null, { status: 204 });
});
