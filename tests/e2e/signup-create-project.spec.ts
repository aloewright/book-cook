import { expect, test } from "@playwright/test";

test("sign-up → create project → open workspace → chat", async ({ page }) => {
  const email = `u-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByLabel("Settings").click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(true);
  await page.getByRole("button", { name: "Light" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(false);
  await page.getByRole("button", { name: "System" }).click();
  await page.getByLabel("Dashboard").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByPlaceholder("Working title…").fill("Quiet Operator");
  await page.getByRole("button", { name: /new book/i }).click();

  const link = page.getByRole("link", { name: /quiet operator/i });
  await expect(link).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Recently deleted" })).toBeVisible();
  await expect(page.getByText(/days left to restore/i)).toBeVisible();
  await expect(link).toBeHidden();
  await page.getByRole("button", { name: /restore/i }).click();
  await expect(link).toBeVisible();
  await link.click();

  await expect(page.getByRole("heading", { name: "Concept", exact: true })).toBeVisible();
  await page.getByLabel("Go to Voice workflow").click();
  await expect(page.getByRole("heading", { name: /voice library/i })).toBeVisible();
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        return root.scrollHeight - window.innerHeight;
      });
    })
    .toBeLessThanOrEqual(2);
  await page.getByLabel("Go to Publish workflow").click();
  await expect(page).toHaveURL(/#publish$/);
  await expect(page.getByRole("heading", { name: "Publish", exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        return { overflow: root.scrollHeight - window.innerHeight, scrollY: window.scrollY };
      }),
    )
    .toEqual({ overflow: 0, scrollY: 0 });
  await page.getByLabel("Go to Outline workflow").click();
  await expect(page).toHaveURL(/#outline$/);
  await expect(page.getByRole("heading", { name: /outline builder/i })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        return { overflow: root.scrollHeight - window.innerHeight, scrollY: window.scrollY };
      }),
    )
    .toEqual({ overflow: 0, scrollY: 0 });

  // Aloysius accepts the message and starts a response turn.
  await page.getByPlaceholder("Ask Aloysius…").fill("hello");
  await page.getByPlaceholder("Ask Aloysius…").press("Enter");
  await expect(page.getByText("hello")).toBeVisible();
  await expect(page.getByPlaceholder("Aloysius is replying…")).toBeVisible();
});
