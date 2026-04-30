import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { chapters, chat_messages, outlines, projects, sections, voices } from "../db/schema";
import type { Env } from "../env";
import { type AuthVariables, requireUser } from "../middleware/auth";
import { generateOutline } from "../skills/architect";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["nonfiction", "fiction"]),
  genre: z.string().optional(),
  target_word_count: z.number().int().min(5000).max(200000).optional(),
});

const patchSchema = z.object({
  voice_id: z.string().uuid().nullable().optional(),
});

const outlineSchema = z.object({
  framework: z.string().max(80).optional(),
  questionnaire: z.string().min(1).max(20_000),
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
    target_word_count: body.target_word_count ?? (body.type === "nonfiction" ? 50000 : 75000),
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
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);
  return c.json(p);
});

projectsRoute.get("/:id/chat", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);
  const rows = await db
    .select()
    .from(chat_messages)
    .where(eq(chat_messages.project_id, id))
    .orderBy(asc(chat_messages.created_at))
    .limit(200);
  const items = rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      text: typeof r.content_json === "string" ? r.content_json : JSON.stringify(r.content_json),
    }));
  return c.json({ items });
});

projectsRoute.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = patchSchema.parse(await c.req.json());
  const db = drizzle(c.env.DB);

  const [p] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  if (body.voice_id) {
    const [voice] = await db
      .select({ id: voices.id })
      .from(voices)
      .where(and(eq(voices.id, body.voice_id), eq(voices.user_id, user.id)))
      .limit(1);
    if (!voice) return c.json({ error: "voice not found" }, 404);
  }

  const values =
    body.voice_id === undefined
      ? { updated_at: new Date() }
      : {
          voice_id: body.voice_id,
          status: body.voice_id ? ("voice" as const) : ("concept" as const),
          updated_at: new Date(),
        };

  await db
    .update(projects)
    .set(values)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id)));

  return c.json({ ok: true });
});

projectsRoute.get("/:id/outline", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const [outline] = await db
    .select()
    .from(outlines)
    .where(eq(outlines.project_id, id))
    .orderBy(desc(outlines.version))
    .limit(1);
  const chapterRows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.project_id, id))
    .orderBy(asc(chapters.ordinal));
  return c.json({ outline: outline ?? null, chapters: chapterRows });
});

projectsRoute.post("/:id/outlines", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = outlineSchema.parse(await c.req.json());
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const [voice] = p.voice_id
    ? await db.select().from(voices).where(eq(voices.id, p.voice_id)).limit(1)
    : [];
  const outline = generateOutline({
    title: p.title,
    type: p.type,
    genre: p.genre,
    targetWordCount: p.target_word_count,
    framework: body.framework,
    questionnaire: body.questionnaire,
    voiceProfile: voice?.profile_json,
  });
  const [{ versionMax }] = await db
    .select({ versionMax: sql<number>`coalesce(max(${outlines.version}), 0)` })
    .from(outlines)
    .where(eq(outlines.project_id, id));
  const version = (versionMax ?? 0) + 1;
  const outlineId = crypto.randomUUID();

  await db.insert(outlines).values({
    id: outlineId,
    project_id: id,
    framework: outline.framework,
    structure_json: outline,
    version,
  });
  await db
    .update(projects)
    .set({ status: "outline", updated_at: new Date() })
    .where(eq(projects.id, id));

  let ordinal = 1;
  for (const act of outline.acts) {
    for (const chapter of act.chapters) {
      const chapterId = crypto.randomUUID();
      await db.insert(chapters).values({
        id: chapterId,
        project_id: id,
        ordinal,
        title: chapter.title,
        summary: chapter.summary,
        target_words: chapter.target_words,
      });
      for (const [index, section] of chapter.sections.entries()) {
        await db.insert(sections).values({
          id: crypto.randomUUID(),
          chapter_id: chapterId,
          ordinal: index + 1,
          kind: section.kind,
          prompt: section.prompt,
        });
      }
      ordinal += 1;
    }
  }

  return c.json({ id: outlineId, outline, chapters_created: ordinal - 1 }, 201);
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
