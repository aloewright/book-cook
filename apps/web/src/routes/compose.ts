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
    const system =
      body.type === "nonfiction"
        ? "You write one-sentence loglines for nonfiction books. Output ONE sentence in plain prose. No quotes, no preface, no labels. ≤30 words. Subject · tension · payoff. Vivid and specific, no clichés."
        : "Generate a one-sentence logline of a story that contains a description of a protagonist, the conflict or obstacle or journey they are going to take during the story, and the stakes involved if they are unsuccessful in their mission. Be descriptive yet concise. Avoid the use of any em-dashes and avoid using any clichés, idioms, or overused metaphors. Be conscious of the character arc the protagonist is going to go on during the story and hint at it. Output ONE sentence in plain prose. No quotes, no preface, no labels.";
    const user = "Generate a logline.";
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
