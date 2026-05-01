import { expect, test } from "@playwright/test";

test("sign-up -> outline -> chapter editor autosave", async ({ page }) => {
  const email = `chapter-${Date.now()}@x.test`;
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

  await page.getByRole("link", { name: /1\. The Cost of Staying Stuck/ }).click();
  await expect(page).toHaveURL(/\/chapters\//);
  await expect(page.getByRole("heading", { name: "1. The Cost of Staying Stuck" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /section drafts/i })).toBeVisible();

  await page
    .getByRole("button", { name: /draft section/i })
    .first()
    .click();
  await expect(page.getByTestId("section-diff").first()).toContainText("concrete moment", {
    timeout: 15_000,
  });
  await page
    .getByRole("button", { name: /accept into chapter/i })
    .first()
    .click();

  const editor = page.locator('[data-testid="chapter-editor"] [contenteditable="true"]').first();
  await expect(editor).toContainText("concrete moment", { timeout: 10_000 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const editorSurface = document.querySelector("[data-testid='chapter-editor'] .bn-editor");
        const editable = document.querySelector("[data-testid='chapter-editor'] [contenteditable]");
        if (!editorSurface || !editable) return false;
        const surfaceStyle = getComputedStyle(editorSurface);
        const editableStyle = getComputedStyle(editable);
        return (
          surfaceStyle.backgroundColor !== "rgb(255, 255, 255)" &&
          editableStyle.color !== "rgb(0, 0, 0)"
        );
      }),
    )
    .toBe(true);
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type("This chapter opens with a concrete operator under pressure.");
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  const tighten = page.getByRole("button", { name: /tighten/i });
  if (!(await tighten.isEnabled())) {
    await editor.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
  }
  await expect(tighten).toBeEnabled();
  await tighten.click();
  await expect(page.getByTestId("inline-ai-diff")).toContainText("Tightened:", {
    timeout: 15_000,
  });
  await page.getByRole("button", { name: /apply replacement/i }).click();
  await expect(editor).toContainText("Tightened:", { timeout: 10_000 });

  await expect(page.getByText(/Saving|Saved/)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/saved words/i)).toBeVisible();
});
