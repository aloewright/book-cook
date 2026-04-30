import { expect, test } from "@playwright/test";

test("sign-up → create project → open workspace → chat", async ({ page }) => {
  const email = `u-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByPlaceholder("Working title…").fill("Quiet Operator");
  await page.getByRole("button", { name: /new book/i }).click();

  const link = page.getByRole("link", { name: /quiet operator/i });
  await expect(link).toBeVisible();
  await link.click();

  await expect(page.getByRole("heading", { name: /voice library/i })).toBeVisible();
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        return root.scrollHeight - window.innerHeight;
      });
    })
    .toBeLessThanOrEqual(2);

  // Aloysius accepts the message and starts a response turn.
  await page.getByPlaceholder("Ask Aloysius…").fill("hello");
  await page.getByPlaceholder("Ask Aloysius…").press("Enter");
  await expect(page.getByText("hello")).toBeVisible();
  await expect(page.getByPlaceholder("Aloysius is replying…")).toBeVisible();
});
