import { expect, test } from "@playwright/test";

test("fiction projects can generate a genre-specific outline", async ({ page }) => {
  const email = `outline-style-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByPlaceholder(/Working title/).fill("Signal Garden");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Fiction", exact: true }).click();
  await page.getByRole("button", { name: /new book/i }).click();

  await page.getByRole("link", { name: /signal garden/i }).click();
  await expect(page.getByRole("heading", { name: /outline builder/i })).toBeVisible();
  await page.getByRole("combobox", { name: /outline framework/i }).click();
  await page.getByRole("option", { name: /Sci-Fi World/i }).click();
  await expect(page.getByText(/Speculative premise, world rules/i)).toBeVisible();

  await page
    .getByPlaceholder(/Protagonist, want, weakness/i)
    .fill("A botanist discovers plants that store memories from future colonists.");
  await page.getByRole("button", { name: /generate outline/i }).click();

  await expect(page.getByText(/1\. World signal/)).toBeVisible();
  await expect(page.getByText(/14 chapters/)).toBeVisible();
});
