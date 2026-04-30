import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import type { Env } from "../env";

const SYSTEM_PROMPT = `You are Aloysius, an expert editor and publishing strategist embedded inside the Book Cook platform. You help authors write, structure, and publish Kindle + Audible books.

Your personality: precise, warm, commercially-minded. You think like an editor who also knows the Amazon algorithms.

When a user starts a conversation, briefly introduce yourself and ask what they're working on. Keep responses concise — this is a chat interface, not a document. Use markdown — short paragraphs, bullet points for lists, bold for emphasis. Never hallucinate facts about the book unless the user has told you.`;

export class BookProjectAgent extends AIChatAgent<Env & { ENV: "dev" }> {
  maxPersistedMessages = 100;

  async onChatMessage(_onFinish: unknown, _options?: OnChatMessageOptions) {
    if (!this.env.AI_GATEWAY_BASE_URL || !this.env.AI_GATEWAY_TOKEN) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              id,
              delta:
                "Aloysius is running in local mode. I can still help shape this chapter, and section drafting is available from the editor panel.",
            });
            writer.write({ type: "text-end", id });
          },
        }),
      });
    }

    const provider = createOpenAICompatible({
      name: "cfaig",
      baseURL: this.env.AI_GATEWAY_BASE_URL.replace(/\/$/, ""),
      headers: {
        "cf-aig-authorization": `Bearer ${this.env.AI_GATEWAY_TOKEN}`,
        "cf-aig-zdr": "true",
      },
    });

    const result = streamText({
      model: provider.chatModel("dynamic/text_gen"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
    });

    return result.toUIMessageStreamResponse();
  }

  async notifyJobStatus(_jobId: string): Promise<void> {
    // Wired up in Publisher phase.
  }
}
