import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import {
  chapters,
  chat_messages,
  outlines,
  projects,
  publisher_packs,
  sections,
  voices,
} from "../db/schema";
import type { Env } from "../env";
import { type AuthVariables, requireUser } from "../middleware/auth";
import { generateOutline } from "../skills/architect";
import {
  type PublisherSeoPack,
  normalizePack,
  synthesizePublisherSeo,
  validatePublisherSeoPack,
} from "../skills/publisher/seo";

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

const publisherPackSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).default(""),
  series_name: z.string().max(200).default(""),
  description_html: z.string().max(4000),
  keywords: z.array(z.string().min(1).max(50)).length(7),
  bisac: z.array(z.string().min(1).max(120)).length(2),
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

projectsRoute.get("/:id/publisher-pack", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const [pack] = await db
    .select()
    .from(publisher_packs)
    .where(eq(publisher_packs.project_id, id))
    .orderBy(desc(publisher_packs.updated_at))
    .limit(1);

  return c.json({ pack: pack ? serializePublisherPack(pack) : null });
});

projectsRoute.post("/:id/publisher-pack/seo", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const chapterRows = await db
    .select({
      title: chapters.title,
      summary: chapters.summary,
      draft_md: chapters.draft_md,
    })
    .from(chapters)
    .where(eq(chapters.project_id, id))
    .orderBy(asc(chapters.ordinal));

  if (chapterRows.length === 0) {
    return c.json({ error: "generate an outline before creating publisher metadata" }, 409);
  }

  const result = await synthesizePublisherSeo(c.env, {
    title: p.title,
    type: p.type,
    genre: p.genre,
    chapters: chapterRows,
  });
  const validationErrors = validatePublisherSeoPack(result.pack);
  if (validationErrors.length)
    return c.json({ error: { message: validationErrors.join(" ") } }, 422);

  const now = new Date();
  const packId = crypto.randomUUID();
  await db.insert(publisher_packs).values({
    id: packId,
    project_id: id,
    title: result.pack.title,
    subtitle: result.pack.subtitle,
    series_name: result.pack.series_name,
    description_html: result.pack.description_html,
    keywords_json: result.pack.keywords,
    bisac_json: result.pack.bisac,
    status: "draft",
    created_at: now,
    updated_at: now,
  });
  await db
    .update(projects)
    .set({ status: "publishing", updated_at: now })
    .where(eq(projects.id, id));

  return c.json(
    { pack: { id: packId, status: "draft", ...result.pack }, llm_response: result.llm_response },
    201,
  );
});

projectsRoute.patch("/:id/publisher-pack", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select({ id: projects.id, title: projects.title, type: projects.type, genre: projects.genre })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const body = publisherPackSchema.parse(await c.req.json());
  const pack = normalizePack(body, { title: p.title, type: p.type, genre: p.genre, chapters: [] });
  const validationErrors = validatePublisherSeoPack(pack);
  if (validationErrors.length)
    return c.json({ error: { message: validationErrors.join(" ") } }, 422);

  const [existing] = await db
    .select({ id: publisher_packs.id, status: publisher_packs.status })
    .from(publisher_packs)
    .where(eq(publisher_packs.project_id, id))
    .orderBy(desc(publisher_packs.updated_at))
    .limit(1);
  if (!existing) return c.json({ error: "publisher pack not found" }, 404);
  if (existing.status === "approved") return c.json({ error: "approved pack is locked" }, 409);

  await db
    .update(publisher_packs)
    .set({
      title: pack.title,
      subtitle: pack.subtitle,
      series_name: pack.series_name,
      description_html: pack.description_html,
      keywords_json: pack.keywords,
      bisac_json: pack.bisac,
      updated_at: new Date(),
    })
    .where(eq(publisher_packs.id, existing.id));

  return c.json({ pack: { id: existing.id, status: "draft", ...pack } });
});

projectsRoute.post("/:id/publisher-pack/approve", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [p] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, user.id), isNull(projects.deleted_at)))
    .limit(1);
  if (!p) return c.json({ error: "not found" }, 404);

  const [pack] = await db
    .select()
    .from(publisher_packs)
    .where(eq(publisher_packs.project_id, id))
    .orderBy(desc(publisher_packs.updated_at))
    .limit(1);
  if (!pack) return c.json({ error: "publisher pack not found" }, 404);

  const serialized = serializePublisherPack(pack);
  const validationErrors = validatePublisherSeoPack(serialized);
  if (validationErrors.length)
    return c.json({ error: { message: validationErrors.join(" ") } }, 422);

  await db
    .update(publisher_packs)
    .set({ status: "approved", updated_at: new Date() })
    .where(eq(publisher_packs.id, pack.id));

  return c.json({ pack: { ...serialized, status: "approved" } });
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

function serializePublisherPack(row: typeof publisher_packs.$inferSelect): PublisherSeoPack & {
  id: string;
  status: "draft" | "approved";
} {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    series_name: row.series_name,
    description_html: row.description_html,
    keywords: Array.isArray(row.keywords_json) ? row.keywords_json.map(String) : [],
    bisac: Array.isArray(row.bisac_json) ? row.bisac_json.map(String) : [],
    status: row.status,
  };
}
