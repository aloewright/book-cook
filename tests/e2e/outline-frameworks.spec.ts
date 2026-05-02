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
  await page.getByLabel("Go to Outline workflow").click();
  await expect(page.getByRole("heading", { name: /outline builder/i })).toBeVisible();
  await expect(page.getByTestId("book-flow-preview")).toBeVisible();
  await page.getByRole("combobox", { name: /outline framework/i }).click();
  await page.getByRole("option", { name: /Sci-Fi World/i }).click();
  await expect(page.getByText(/Speculative premise, world rules/i)).toBeVisible();

  await page
    .getByPlaceholder(/Protagonist, want, weakness/i)
    .fill("A botanist discovers plants that store memories from future colonists.");
  await expect(page.getByRole("heading", { name: /chapter decision board/i })).toBeVisible();
  await page.getByLabel("Chapter 1 working title").fill("The Memory Orchard");
  await page
    .getByLabel("Chapter 1 what happens")
    .fill("Mara finds a greenhouse tree replaying a future evacuation.");
  await page.getByLabel("Chapter 1 purpose").fill("Prove the premise with a visible event.");
  await page.getByLabel("Chapter 1 POV").fill("Mara");
  await page.getByLabel("Chapter 1 characters").fill("Mara, Ivo");
  await page.getByLabel("Character 1 name").fill("Mara");
  await page.getByRole("combobox", { name: "Character 1 arc", exact: true }).click();
  await page.getByRole("option", { name: "Positive Change", exact: true }).click();
  await page
    .getByLabel("Character 1 arc position")
    .fill("Refusing the truth that memory can be communal.");
  await page
    .getByLabel("Character 1 scene role")
    .fill("Protagonist under scientific and family pressure.");
  await page.getByRole("button", { name: /add character/i }).click();
  await page.getByLabel("Character 2 name").fill("Ivo");
  await page.getByRole("combobox", { name: "Character 2 arc", exact: true }).click();
  await page.getByRole("option", { name: "Flat", exact: true }).click();
  await page.getByLabel("Character 2 arc position").fill("Already carries the story truth.");
  await page.getByPlaceholder(/Default scene cast/i).fill("Use Mara and Ivo in discovery scenes.");
  await page.getByRole("button", { name: /generate outline/i }).click();

  const plannedChapter = page.getByRole("link", { name: /1\. The Memory Orchard/ });
  await expect(plannedChapter).toBeVisible();
  await expect(plannedChapter).toContainText(/future evacuation/);
  await expect(page.getByText(/14 chapters/)).toBeVisible();
  await plannedChapter.click();
  await expect(page).toHaveURL(/\/chapters\//);
  await page.getByRole("link", { name: "Back to workspace" }).click();
  await page.getByLabel("Go to Outline workflow").click();
  await page.getByRole("link", { name: "Full book" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { name: "Full book" })).toBeVisible();
});

test("reduced-motion users see outline text and static book flow immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const email = `outline-reduced-${Date.now()}@x.test`;
  await page.goto("/sign-up");
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByPlaceholder(/Working title/).fill("Still Map");
  await page.getByRole("button", { name: /new book/i }).click();
  await page.getByRole("link", { name: /still map/i }).click();
  await page.getByLabel("Go to Outline workflow").click();

  await expect(page.getByRole("heading", { name: /outline builder/i })).toBeVisible();
  await expect(page.getByTestId("book-flow-static")).toBeVisible();
  await expect(page.getByText(/Pick a framework/i)).toBeVisible();
});
