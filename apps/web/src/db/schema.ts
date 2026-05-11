import { sql } from "drizzle-orm";
import { blob, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().notNull();
const ts = (name: string) => integer(name, { mode: "timestamp" }).notNull();
const tsNullable = (name: string) => integer(name, { mode: "timestamp" });
const cents = (name: string) => integer(name).notNull().default(0);

// Better Auth user table. Required base columns: id, name, email,
// emailVerified, image, createdAt, updatedAt. Custom fields (plan, phase,
// daily_budget_cents) are configured via additionalFields in src/auth.ts.
export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull().default(""),
  email: text("email").unique().notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  // Custom fields:
  plan: text("plan", { enum: ["free", "pro"] })
    .notNull()
    .default("pro"),
  phase: text("phase", {
    enum: ["chassis", "architect", "writer", "publisher", "scout", "launch"],
  })
    .notNull()
    .default("chassis"),
  daily_budget_cents: integer("daily_budget_cents").notNull().default(5000),
  elevenlabs_key_ciphertext: blob("elevenlabs_key_ciphertext"),
  elevenlabs_key_iv: blob("elevenlabs_key_iv"),
  stripe_customer_id: text("stripe_customer_id"),
  is_admin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: ts("createdAt").default(sql`(unixepoch())`),
  updatedAt: ts("updatedAt").default(sql`(unixepoch())`),
});

// Better Auth tables. The Drizzle adapter expects singular names: user,
// session, account, verification. We point Better Auth's `user` model at
// our `users` table via the schema mapping in src/auth.ts; the other three
// are created here.

export const session = sqliteTable("session", {
  id: id(),
  userId: text("userId")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: ts("expiresAt"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: ts("createdAt").default(sql`(unixepoch())`),
  updatedAt: ts("updatedAt").default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: id(),
  userId: text("userId")
    .references(() => users.id)
    .notNull(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: tsNullable("accessTokenExpiresAt"),
  refreshTokenExpiresAt: tsNullable("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("createdAt").default(sql`(unixepoch())`),
  updatedAt: ts("updatedAt").default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expiresAt"),
  createdAt: ts("createdAt").default(sql`(unixepoch())`),
  updatedAt: ts("updatedAt").default(sql`(unixepoch())`),
});

export const voices = sqliteTable("voices", {
  id: id(),
  user_id: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  source: text("source", { enum: ["custom", "postpilot"] }).notNull(),
  postpilot_slug: text("postpilot_slug"),
  profile_md: text("profile_md").notNull().default(""),
  profile_json: text("profile_json", { mode: "json" }).notNull().default(sql`'{}'`),
  created_at: ts("created_at").default(sql`(unixepoch())`),
  updated_at: ts("updated_at").default(sql`(unixepoch())`),
});

export const voice_samples = sqliteTable(
  "voice_samples",
  {
    id: id(),
    voice_id: text("voice_id")
      .references(() => voices.id)
      .notNull(),
    r2_key: text("r2_key").notNull(),
    source: text("source", { enum: ["paste", "upload", "url"] }).notNull(),
    word_count: integer("word_count").notNull().default(0),
    created_at: ts("created_at").default(sql`(unixepoch())`),
  },
  (t) => ({ byVoice: index("voice_samples_by_voice").on(t.voice_id) }),
);

export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    user_id: text("user_id")
      .references(() => users.id)
      .notNull(),
    title: text("title").notNull(),
    type: text("type", { enum: ["nonfiction", "fiction"] }).notNull(),
    genre: text("genre"),
    status: text("status", {
      enum: ["concept", "voice", "outline", "drafting", "publishing", "launched"],
    })
      .notNull()
      .default("concept"),
    voice_id: text("voice_id").references(() => voices.id),
    target_word_count: integer("target_word_count").notNull().default(50000),
    created_at: ts("created_at").default(sql`(unixepoch())`),
    updated_at: ts("updated_at").default(sql`(unixepoch())`),
    deleted_at: tsNullable("deleted_at"),
  },
  (t) => ({ byUser: index("projects_by_user").on(t.user_id) }),
);

export const outlines = sqliteTable("outlines", {
  id: id(),
  project_id: text("project_id")
    .references(() => projects.id)
    .notNull(),
  framework: text("framework").notNull(),
  structure_json: text("structure_json", { mode: "json" }).notNull(),
  version: integer("version").notNull().default(1),
  created_at: ts("created_at").default(sql`(unixepoch())`),
  updated_at: ts("updated_at").default(sql`(unixepoch())`),
});

export const chapters = sqliteTable(
  "chapters",
  {
    id: id(),
    project_id: text("project_id")
      .references(() => projects.id)
      .notNull(),
    ordinal: integer("ordinal").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    status: text("status", {
      enum: ["pending", "drafting", "drafted", "approved"],
    })
      .notNull()
      .default("pending"),
    target_words: integer("target_words").notNull().default(2400),
    draft_json: text("draft_json", { mode: "json" }),
    draft_md: text("draft_md").notNull().default(""),
    created_at: ts("created_at").default(sql`(unixepoch())`),
    updated_at: ts("updated_at").default(sql`(unixepoch())`),
  },
  (t) => ({ byProject: index("chapters_by_project").on(t.project_id, t.ordinal) }),
);

export const sections = sqliteTable(
  "sections",
  {
    id: id(),
    chapter_id: text("chapter_id")
      .references(() => chapters.id)
      .notNull(),
    ordinal: integer("ordinal").notNull(),
    kind: text("kind").notNull(),
    prompt: text("prompt").notNull().default(""),
    draft_md: text("draft_md").notNull().default(""),
    beginning_md: text("beginning_md").notNull().default(""),
    middle_md: text("middle_md").notNull().default(""),
    end_md: text("end_md").notNull().default(""),
    status: text("status", {
      enum: ["pending", "generating", "drafted", "approved"],
    })
      .notNull()
      .default("pending"),
    created_at: ts("created_at").default(sql`(unixepoch())`),
    updated_at: ts("updated_at").default(sql`(unixepoch())`),
  },
  (t) => ({ byChapter: index("sections_by_chapter").on(t.chapter_id, t.ordinal) }),
);

export const revisions = sqliteTable(
  "revisions",
  {
    id: id(),
    target_table: text("target_table").notNull(),
    target_id: text("target_id").notNull(),
    before_md: text("before_md").notNull(),
    after_md: text("after_md").notNull(),
    llm_response: text("llm_response", { mode: "json" }),
    created_at: ts("created_at").default(sql`(unixepoch())`),
  },
  (t) => ({ byTarget: index("revisions_by_target").on(t.target_table, t.target_id) }),
);

export const chat_messages = sqliteTable(
  "chat_messages",
  {
    id: id(),
    project_id: text("project_id")
      .references(() => projects.id)
      .notNull(),
    role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
    content_json: text("content_json", { mode: "json" }).notNull(),
    model: text("model"),
    route: text("route"),
    tokens_in: integer("tokens_in").notNull().default(0),
    tokens_out: integer("tokens_out").notNull().default(0),
    cost_cents: cents("cost_cents"),
    created_at: ts("created_at").default(sql`(unixepoch())`),
  },
  (t) => ({ byProject: index("chat_messages_by_project").on(t.project_id, t.created_at) }),
);

export const market_queries = sqliteTable("market_queries", {
  id: id(),
  user_id: text("user_id")
    .references(() => users.id)
    .notNull(),
  project_id: text("project_id").references(() => projects.id),
  niche: text("niche").notNull(),
  type: text("type", { enum: ["nonfiction", "fiction"] }).notNull(),
  params_json: text("params_json", { mode: "json" }).notNull().default(sql`'{}'`),
  created_at: ts("created_at").default(sql`(unixepoch())`),
});

export const dataset_snapshots = sqliteTable("dataset_snapshots", {
  id: id(),
  week_iso: text("week_iso").notNull().unique(),
  r2_key: text("r2_key").notNull(),
  source: text("source").notNull(),
  created_at: ts("created_at").default(sql`(unixepoch())`),
});

export const market_findings = sqliteTable("market_findings", {
  id: id(),
  query_id: text("query_id")
    .references(() => market_queries.id)
    .notNull(),
  dataset_snapshot_id: text("dataset_snapshot_id")
    .references(() => dataset_snapshots.id)
    .notNull(),
  summary_md: text("summary_md").notNull(),
  evidence_json: text("evidence_json", { mode: "json" }).notNull(),
  created_at: ts("created_at").default(sql`(unixepoch())`),
});

export const publisher_packs = sqliteTable("publisher_packs", {
  id: id(),
  project_id: text("project_id")
    .references(() => projects.id)
    .notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  series_name: text("series_name").notNull().default(""),
  description_html: text("description_html").notNull().default(""),
  keywords_json: text("keywords_json", { mode: "json" }).notNull().default(sql`'[]'`),
  bisac_json: text("bisac_json", { mode: "json" }).notNull().default(sql`'[]'`),
  status: text("status", { enum: ["draft", "approved"] })
    .notNull()
    .default("draft"),
  created_at: ts("created_at").default(sql`(unixepoch())`),
  updated_at: ts("updated_at").default(sql`(unixepoch())`),
});

export const gtm_briefs = sqliteTable("gtm_briefs", {
  id: id(),
  project_id: text("project_id")
    .references(() => projects.id)
    .notNull(),
  content_json: text("content_json", { mode: "json" }).notNull(),
  brief_md: text("brief_md").notNull(),
  r2_key: text("r2_key").notNull(),
  created_at: ts("created_at").default(sql`(unixepoch())`),
  updated_at: ts("updated_at").default(sql`(unixepoch())`),
});

export const render_jobs = sqliteTable(
  "render_jobs",
  {
    id: id(),
    project_id: text("project_id")
      .references(() => projects.id)
      .notNull(),
    kind: text("kind", {
      enum: ["epub", "docx", "pdf", "kpf", "narration", "master_mix"],
    }).notNull(),
    status: text("status", {
      enum: ["queued", "running", "completed", "failed"],
    })
      .notNull()
      .default("queued"),
    workflow_id: text("workflow_id"),
    output_r2_key: text("output_r2_key"),
    error: text("error"),
    started_at: ts("started_at").default(sql`(unixepoch())`),
    completed_at: tsNullable("completed_at"),
    cost_cents: cents("cost_cents"),
  },
  (t) => ({ byProject: index("render_jobs_by_project").on(t.project_id) }),
);

export const usage_daily = sqliteTable(
  "usage_daily",
  {
    id: id(),
    user_id: text("user_id")
      .references(() => users.id)
      .notNull(),
    day_iso: text("day_iso").notNull(),
    route: text("route").notNull(),
    tokens_in: integer("tokens_in").notNull().default(0),
    tokens_out: integer("tokens_out").notNull().default(0),
    cost_cents: cents("cost_cents"),
  },
  (t) => ({
    byUserDay: index("usage_daily_by_user_day").on(t.user_id, t.day_iso),
  }),
);
