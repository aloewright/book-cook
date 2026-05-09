import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { gateway } from "../lib/gateway";
import { type AuthVariables, requireUser } from "../middleware/auth";

const loglineSchema = z.object({
  protagonist: z.string().max(500).optional().default(""),
  conflict: z.string().max(500).optional().default(""),
  stakes: z.string().max(500).optional().default(""),
  type: z.enum(["fiction", "nonfiction"]).optional().default("fiction"),
});

export const composeRoute = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", requireUser)
  .post("/logline", async (c) => {
    const body = loglineSchema.parse(await c.req.json());
    if (!body.protagonist.trim() && !body.conflict.trim() && !body.stakes.trim()) {
      return c.json(
        {
          error: {
            code: "BadRequest",
            message: "Fill at least one of protagonist, conflict, stakes.",
          },
        },
        400,
      );
    }
    const system =
      body.type === "nonfiction"
        ? "You write one-sentence loglines for nonfiction books. Output ONE sentence in plain prose. No quotes, no preface, no labels. ≤30 words. Subject · tension · payoff. Vivid and specific, no clichés."
        : "You write one-sentence loglines for novels. Output ONE sentence in plain prose. No quotes, no preface, no labels. ≤30 words. Protagonist · conflict · stakes. Vivid and specific, no clichés.";
    const user = [
      body.protagonist && `Protagonist: ${body.protagonist}`,
      body.conflict && `Conflict: ${body.conflict}`,
      body.stakes && `Stakes: ${body.stakes}`,
    ]
      .filter(Boolean)
      .join("\n");
    const result = await gateway.chatCompletion(c.env, {
      route: "dynamic/text_gen",
      temperature: 0.85,
      maxTokens: 120,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const logline = result.text.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
    return c.json({ logline });
  });
