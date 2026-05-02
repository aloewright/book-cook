import { expect, test } from "@playwright/test";

test("sign-up → create project → open workspace → chat", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as unknown as { __bookCookLoadCount?: number };
    target.__bookCookLoadCount = (target.__bookCookLoadCount ?? 0) + 1;
  });
  const email = `u-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByLabel("Settings").click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("book-cook-light");
  const bookCookPrimary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
  );
  await page.getByLabel("Color theme").click();
  await page.getByRole("option", { name: "GitHub" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("github-light");
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
      ),
    )
    .not.toBe(bookCookPrimary);
  await page.getByRole("button", { name: "Dark" }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe("github-dark");
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
  await page.getByRole("combobox", { name: /post pilot author/i }).click();
  await expect(page.getByRole("option", { name: /Zora Neale Hurston/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.keyboard.press("Escape");
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

  const loadCountBeforeRouteSwitch = await page.evaluate(
    () => (window as unknown as Record<string, number>).__bookCookLoadCount,
  );
  await page.getByLabel("Go to Book workflow").click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { name: "Full book" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as Record<string, number>).__bookCookLoadCount),
    )
    .toBe(loadCountBeforeRouteSwitch);
  await page.getByRole("button", { name: "Back to workspace" }).click();
  await expect(page.getByRole("heading", { name: "Concept", exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("Failed to fetch dynamically imported module"),
      }),
    );
  });
  await expect(page.getByText("Update ready")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as Record<string, number>).__bookCookLoadCount),
    )
    .toBe(loadCountBeforeRouteSwitch);

  // Aloysius accepts the message and starts a response turn.
  await page.getByPlaceholder("Ask Aloysius…").fill("hello");
  await page.getByPlaceholder("Ask Aloysius…").press("Enter");
  await expect(page.getByText("hello")).toBeVisible();
  await expect(page.getByPlaceholder("Aloysius is replying…")).toBeVisible();
  await expect
    .poll(async () =>
      page.getByPlaceholder(/Ask Aloysius|Aloysius is replying/).evaluate((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.bottom <= window.innerHeight && box.right <= window.innerWidth && box.width > 200
        );
      }),
    )
    .toBe(true);
});
