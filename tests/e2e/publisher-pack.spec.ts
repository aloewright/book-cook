import { expect, test } from "@playwright/test";

test("sign-up -> outline -> publisher SEO pack -> approve", async ({ page }) => {
  const email = `publisher-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByPlaceholder(/Working title/).fill("Quiet Operator");
  await page.getByRole("button", { name: /new book/i }).click();

  await page.getByRole("link", { name: /quiet operator/i }).click();
  await expect(page.getByRole("heading", { name: /outline builder/i })).toBeVisible();

  await page
    .getByPlaceholder(/Reader, promise, proof/i)
    .fill("Readers are stuck in reactive work. Promise a calmer operating model.");
  await page.getByRole("button", { name: /generate outline/i }).click();
  await expect(page.getByText(/1\. The Cost of Staying Stuck/)).toBeVisible();
  await page.getByRole("link", { name: /^full book$/i }).click();
  await expect(page).toHaveURL(/\/projects\/.+\/book$/);
  await expect(page.getByRole("heading", { name: /^full book$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /export pdf/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /export epub/i })).toBeVisible();
  await page
    .getByRole("link", { name: /^edit$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/projects\/.+\/chapters\/.+$/);
  await expect(page.getByRole("heading", { name: /1\. The Cost of Staying Stuck/ })).toBeVisible();
  await page.getByRole("link", { name: /back to workspace/i }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);

  await page.getByRole("heading", { name: "Publish" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /generate seo pack/i }).click();
  await expect(page.getByRole("heading", { name: /kdp preview/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect
    .poll(() =>
      page
        .locator("input")
        .evaluateAll((inputs) =>
          inputs.some((input) =>
            (input as HTMLInputElement).value.includes("BUSINESS & ECONOMICS"),
          ),
        ),
    )
    .toBe(true);

  await page.getByLabel("Subtitle").fill("A calmer system for focused work");
  await page.getByRole("button", { name: /save edits/i }).click();
  await expect(page.getByText("A calmer system for focused work")).toBeVisible();

  await page.getByRole("button", { name: /^approve$/i }).click();
  await expect(page.getByText("Approved")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /save edits/i })).toBeDisabled();
  await expect(page.getByRole("heading", { name: /narration audition/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /audition voices/i })).toBeDisabled();
  await page.getByPlaceholder(/ElevenLabs voice IDs/i).fill("JBFqnCBsd6RMkjVDRZzb");
  await expect(page.getByRole("button", { name: /audition voices/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /master audiobook/i })).toBeDisabled();
  await page.getByRole("link", { name: /open launch/i }).click();
  await expect(page).toHaveURL(/\/projects\/.+\/launch$/);
  await expect(page.getByRole("heading", { name: "Launch" })).toBeVisible();
  await expect(page.getByRole("button", { name: /generate brief/i })).toBeEnabled();
  await expect(page.getByText(/Markdown, HTML, and handoff JSON/i)).toBeVisible();
});
