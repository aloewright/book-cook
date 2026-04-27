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

  await expect(page.getByText(/concept mode/i)).toBeVisible();

  // Aloysius echo
  await page.getByPlaceholder("Ask Aloysius…").fill("hello");
  await page.getByPlaceholder("Ask Aloysius…").press("Enter");
  await expect(page.getByText(/heard "hello"/i)).toBeVisible({ timeout: 10_000 });
});
