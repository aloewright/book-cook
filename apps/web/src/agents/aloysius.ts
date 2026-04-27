import { Agent } from "agents";
import type { Env } from "../env";

// Agent's generic constrains Env to Cloudflare.Env, whose ENV literal is
// narrowed to "dev". We treat our broadened Env as the runtime shape.
export class BookProjectAgent extends Agent<Env & { ENV: "dev" }> {
  async onStart() {
    // Phase 1 stub. Skill modules wire up in later phases.
  }
}
