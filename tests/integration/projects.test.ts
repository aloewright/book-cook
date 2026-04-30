import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

async function signUp() {
  const res = await SELF.fetch("http://x/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `u-${crypto.randomUUID()}@x.test`,
      password: "correct-horse-battery-staple",
      name: "T",
    }),
  });
  return res.headers.get("set-cookie") ?? "";
}

describe("projects", () => {
  it("create + list + get + soft-delete", async () => {
    const cookie = await signUp();
    const headers = { "Content-Type": "application/json", cookie };

    const created = await SELF.fetch("http://x/api/v1/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "My Book", type: "nonfiction" }),
    });
    expect(created.status).toBe(201);
    // biome-ignore lint/suspicious/noExplicitAny: response shape from our own API
    const { id } = (await created.json()) as any;

    const list = await SELF.fetch("http://x/api/v1/projects", { headers });
    // biome-ignore lint/suspicious/noExplicitAny: response shape from our own API
    const items = (await list.json()) as any;
    expect(
      // biome-ignore lint/suspicious/noExplicitAny: row shape from our own API
      items.items.find((p: any) => p.id === id),
    ).toBeTruthy();

    const got = await SELF.fetch(`http://x/api/v1/projects/${id}`, { headers });
    expect(got.status).toBe(200);

    const del = await SELF.fetch(`http://x/api/v1/projects/${id}`, {
      method: "DELETE",
      headers,
    });
    expect(del.status).toBe(204);

    const list2 = await SELF.fetch("http://x/api/v1/projects", { headers });
    // biome-ignore lint/suspicious/noExplicitAny: response shape from our own API
    const items2 = (await list2.json()) as any;
    expect(
      // biome-ignore lint/suspicious/noExplicitAny: row shape from our own API
      items2.items.find((p: any) => p.id === id),
    ).toBeFalsy();
  });
});
