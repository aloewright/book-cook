import { execFile } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const execFileAsync = promisify(execFile);

type RenderKind = "epub" | "pdf" | "kpf";

type RenderRequest = {
  projectId: string;
  kind?: RenderKind;
  title?: string;
  manuscriptMd?: string;
  inputR2Key?: string;
  inline?: boolean;
};

type ToolVersions = {
  pandoc?: string;
  calibre?: string;
  kindlegen?: string;
  weasyprint?: string;
};

export const app = new Hono();

app.use("*", async (c, next) => {
  const token = c.req.header("X-Internal-Token");
  if (
    !process.env.RENDER_WORKER_INTERNAL_TOKEN ||
    token !== process.env.RENDER_WORKER_INTERNAL_TOKEN
  ) {
    return c.text("forbidden", 403);
  }
  await next();
});

app.get("/health", async (c) =>
  c.json({
    ok: true,
    service: "render-worker",
    tools: await toolVersions(),
    ts: Date.now(),
  }),
);

app.post("/render", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as RenderRequest;
  return renderResponse(c, body.kind, body);
});

app.post("/render/:kind", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as RenderRequest;
  return renderResponse(c, c.req.param("kind"), body);
});

async function renderResponse(
  c: { json: (data: unknown, status?: number) => Response },
  kindParam: string | undefined,
  input: RenderRequest,
) {
  const kind = normalizeKind(kindParam ?? input.kind);
  if (!kind) return c.json({ error: "kind must be epub, pdf, or kpf" }, 400);
  if (!input.projectId?.trim()) return c.json({ error: "projectId is required" }, 400);

  const startedAt = Date.now();
  const rendered = await renderManuscript({
    projectId: input.projectId,
    kind,
    title: input.title ?? "Untitled Book",
    manuscriptMd: input.manuscriptMd ?? defaultManuscript(input.projectId),
  });
  const upload = await uploadToR2(rendered.r2Key, rendered.bytes, rendered.contentType);

  return c.json({
    projectId: input.projectId,
    kind,
    r2Key: rendered.r2Key,
    contentType: rendered.contentType,
    bytes: rendered.bytes.byteLength,
    stored: upload.stored,
    storage: upload.message,
    bodyBase64: input.inline ? rendered.bytes.toString("base64") : undefined,
    durationMs: Date.now() - startedAt,
  });
}

export async function renderManuscript(input: {
  projectId: string;
  kind: RenderKind;
  title: string;
  manuscriptMd: string;
}) {
  const workDir = path.join(tmpdir(), `book-cook-render-${crypto.randomUUID()}`);
  await mkdir(workDir, { recursive: true });
  try {
    const source = path.join(workDir, "manuscript.md");
    const epub = path.join(workDir, "book.epub");
    const output = path.join(workDir, `book.${input.kind}`);
    await writeFile(source, input.manuscriptMd, "utf8");

    if (input.kind === "epub") {
      await execFileAsync("pandoc", [source, "-o", output, "--metadata", `title=${input.title}`]);
    } else if (input.kind === "pdf") {
      await execFileAsync("pandoc", [
        source,
        "-o",
        output,
        "--pdf-engine=weasyprint",
        "--metadata",
        `title=${input.title}`,
      ]);
    } else {
      await execFileAsync("pandoc", [source, "-o", epub, "--metadata", `title=${input.title}`]);
      await renderKindle(epub, output, workDir);
    }

    const bytes = await readFile(output);
    return {
      bytes,
      r2Key: `projects/${input.projectId}/renders/${Date.now()}.${input.kind}`,
      contentType: contentTypeFor(input.kind),
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export function contentTypeFor(kind: RenderKind) {
  if (kind === "epub") return "application/epub+zip";
  if (kind === "pdf") return "application/pdf";
  return "application/vnd.amazon.mobi8-ebook";
}

export function normalizeKind(value: string | undefined): RenderKind | undefined {
  return value === "epub" || value === "pdf" || value === "kpf" ? value : undefined;
}

async function renderKindle(epub: string, output: string, workDir: string) {
  try {
    await execFileAsync("kindlegen", [epub, "-o", "book.kpf"], { cwd: workDir });
  } catch {
    if (await fileExists(output)) return;
    const mobi = path.join(workDir, "book.mobi");
    await execFileAsync("ebook-convert", [epub, mobi]);
    await writeFile(output, await readFile(mobi));
  }
}

async function fileExists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key: string, body: Buffer, contentType: string) {
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  if (!bucket || !endpoint || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    return { stored: false, message: "missing S3-compatible R2 configuration" };
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { stored: true, message: "uploaded" };
}

async function toolVersions(): Promise<ToolVersions> {
  const versions = await Promise.allSettled([
    firstLine("pandoc", ["--version"]),
    firstLine("ebook-convert", ["--version"]),
    firstLine("kindlegen", []),
    firstLine("weasyprint", ["--version"]),
  ]);
  return {
    pandoc: settledValue(versions[0]),
    calibre: settledValue(versions[1]),
    kindlegen: settledValue(versions[2]),
    weasyprint: settledValue(versions[3]),
  };
}

async function firstLine(command: string, args: string[]) {
  const { stdout, stderr } = await execFileAsync(command, args);
  return `${stdout || stderr}`.split("\n")[0]?.trim();
}

function settledValue(result: PromiseSettledResult<string | undefined>) {
  return result.status === "fulfilled" ? result.value : undefined;
}

function defaultManuscript(projectId: string) {
  return `# Book Cook Render ${projectId}

This placeholder manuscript verifies the render-worker toolchain. Production workflows pass a full manuscript R2 key or markdown payload.`;
}

if (!process.env.VITEST) {
  const port = Number.parseInt(process.env.PORT ?? "8787", 10);
  serve({ fetch: app.fetch, port });
  console.log(`render-worker listening on :${port}`);
}
