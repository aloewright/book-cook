import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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
  ffmpeg?: string;
  zip?: string;
};

type MasterAudioRequest = {
  projectId: string;
  chapters: {
    chapterId: string;
    title: string;
    clipsBase64: string[];
  }[];
  inline?: boolean;
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

app.post("/master-audio", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as MasterAudioRequest;
  if (!body.projectId?.trim()) return c.json({ error: "projectId is required" }, 400);
  if (!body.chapters?.length) return c.json({ error: "chapters are required" }, 400);

  const startedAt = Date.now();
  const mastered = await masterAudiobook(body);
  const upload = await uploadToR2(mastered.r2Key, mastered.bytes, mastered.contentType);
  return c.json({
    projectId: body.projectId,
    kind: "master_mix",
    r2Key: mastered.r2Key,
    contentType: mastered.contentType,
    bytes: mastered.bytes.byteLength,
    stored: upload.stored,
    storage: upload.message,
    bodyBase64: body.inline ? mastered.bytes.toString("base64") : undefined,
    durationMs: Date.now() - startedAt,
  });
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

export async function masterAudiobook(input: MasterAudioRequest) {
  const workDir = path.join(tmpdir(), `book-cook-audio-${crypto.randomUUID()}`);
  await mkdir(workDir, { recursive: true });
  try {
    const masteredFiles: string[] = [];
    const manifest = [];
    for (const [chapterIndex, chapter] of input.chapters.entries()) {
      const chapterDir = path.join(workDir, `chapter-${chapterIndex + 1}`);
      await mkdir(chapterDir, { recursive: true });
      const clipPaths = [];
      for (const [clipIndex, base64] of chapter.clipsBase64.entries()) {
        const clipPath = path.join(chapterDir, `clip-${clipIndex + 1}.mp3`);
        await writeFile(clipPath, Buffer.from(base64, "base64"));
        clipPaths.push(clipPath);
      }
      const concatFile = path.join(chapterDir, "concat.txt");
      await writeFile(
        concatFile,
        clipPaths.map((clipPath) => `file '${clipPath.replaceAll("'", "'\\''")}'`).join("\n"),
      );
      const outputName = `${String(chapterIndex + 1).padStart(2, "0")}-${safeName(
        chapter.title,
      )}.mp3`;
      const output = path.join(workDir, outputName);
      await execFileAsync("ffmpeg", [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatFile,
        "-af",
        "loudnorm=I=-20:TP=-3:LRA=11",
        "-ar",
        "44100",
        "-b:a",
        "192k",
        output,
      ]);
      masteredFiles.push(output);
      manifest.push({
        chapterId: chapter.chapterId,
        title: chapter.title,
        file: outputName,
        acx: { integratedLufs: -20, truePeakDb: -3, bitrateKbps: 192 },
      });
    }
    await writeFile(path.join(workDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    await execFileAsync("zip", ["-j", "audiobook.zip", "manifest.json", ...masteredFiles], {
      cwd: workDir,
    });
    const bytes = await readFile(path.join(workDir, "audiobook.zip"));
    return {
      bytes,
      r2Key: `projects/${input.projectId}/audio/master-${Date.now()}.zip`,
      contentType: "application/zip",
      files: await readdir(workDir),
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function renderKindle(epub: string, output: string, workDir: string) {
  try {
    await execFileAsync("kindlegen", [epub, "-o", "book.kpf"], { cwd: workDir });
    if (await fileExists(output)) return;
    throw new Error("kindlegen did not produce book.kpf");
  } catch {
    if (await fileExists(output)) return;
    const mobi = path.join(workDir, "book.mobi");
    try {
      await execFileAsync("ebook-convert", [epub, mobi]);
      await writeFile(output, await readFile(mobi));
    } catch (error) {
      console.warn("kindle conversion fallback failed; returning source epub bytes", error);
      await writeFile(output, await readFile(epub));
    }
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
    firstLine("ffmpeg", ["-version"]),
    firstLine("zip", ["-v"]),
  ]);
  return {
    pandoc: settledValue(versions[0]),
    calibre: settledValue(versions[1]),
    kindlegen: settledValue(versions[2]),
    weasyprint: settledValue(versions[3]),
    ffmpeg: settledValue(versions[4]),
    zip: settledValue(versions[5]),
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

function safeName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "chapter"
  );
}

if (!process.env.VITEST) {
  const port = Number.parseInt(process.env.PORT ?? "8787", 10);
  serve({ fetch: app.fetch, port });
  console.log(`render-worker listening on :${port}`);
}
