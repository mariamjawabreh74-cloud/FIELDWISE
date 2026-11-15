import { expect, test } from "@playwright/test";

test("farmer journey: RTL setup, evidence, rotation, terrain, and a printable plan", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const capture = async (name: string) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `test-results/${name}-${testInfo.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  };
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("simulated-banner")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await capture("home-ar");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: "Your land, understood." }),
  ).toBeVisible();
  await capture("home-en");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page
    .getByRole("link", { name: "Let's get to know your farm", exact: true })
    .last()
    .click();
  await page
    .getByLabel("What would you like to call your farm?")
    .fill("Family olive grove");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/farm\/location/);
  await page
    .getByRole("button", { name: "Use the demo location", exact: true })
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Your draft is saved on this device."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Latitude", { exact: true })).not.toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Try the demo boundary", exact: true })
    .click();
  await expect(page.getByText("Your boundary looks good.")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: /Loam/ }).click();
  await page.getByLabel("How do you water your crops?").selectOption("drip");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/farm\/history/);
  await page
    .getByRole("checkbox", { name: "I don't know", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Save water", exact: true }).click();
  await page
    .getByRole("button", { name: "See my field insights", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A bigger picture of your land." }),
  ).toBeVisible();
  await expect(
    page.getByText("Partial coverage", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Source & limitations", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Explore a missing-data example",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("insufficient-data")).toBeVisible();
  await expect(
    page.getByText("A farm location", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("A valid field boundary", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore the full demo", exact: true })
    .click();
  await expect(
    page.getByText("Partial coverage", { exact: true }),
  ).toBeVisible();
  await capture("analysis");
  const navigate = async (name: string) => {
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("link", { name, exact: true }).click();
  };
  await navigate("Rotation planner");
  await expect(
    page.getByRole("heading", { name: "A season-by-season perspective." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Move Wheat later", exact: true })
    .first()
    .click();
  await expect(
    page
      .locator(".rotation-panel")
      .first()
      .locator(".rotation-crop h3")
      .first(),
  ).toHaveText("Tomato");
  await page
    .getByRole("button", { name: "Save this rotation", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Changes saved.", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".rotation-panel")
      .first()
      .locator(".rotation-crop h3")
      .first(),
  ).toHaveText("Tomato");
  await page
    .getByRole("link", { name: "Compare these strategies", exact: true })
    .click();
  const total = page.getByTestId("score-water_conservation");
  await expect(total).toBeVisible();
  const previousScore = await total.textContent();
  await page
    .getByRole("slider", { name: "Importance of Saving water", exact: true })
    .focus();
  await page.keyboard.press("Home");
  await expect(total).not.toHaveText(previousScore!);
  await page
    .getByRole("button", { name: /Saving water:.*Why this score/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog").getByText("Supporting evidence", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("What we don't know", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await capture("comparison");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Build a plan with this", exact: true })
    .nth(1)
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A practical plan for the months ahead.",
    }),
  ).toBeVisible();
  await expect(page.locator(".month-button")).toHaveCount(12);
  await page.getByRole("checkbox").first().check();
  await expect(
    page.getByText("1 of 13 actions checked", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printed = "true";
    };
  });
  await page
    .getByRole("button", { name: "Print this plan", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "true");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".plan-task:visible")).toHaveCount(13);
  await page.emulateMedia({ media: "screen" });
  await capture("plan");
  await navigate("3D field explorer");
  await expect(
    page.locator(".terrain-canvas-wrap, .terrain-fallback").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Vegetation/ }).click();
  await page
    .getByRole("slider", { name: "Make the hills easier to see", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await page
    .getByRole("slider", { name: "Two-date comparison position", exact: true })
    .focus();
  await page.keyboard.press("Home");
  if (
    await page.getByRole("button", { name: "Zoom in", exact: true }).isVisible()
  ) {
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page
      .getByRole("button", { name: "Rotate view left", exact: true })
      .click();
    await page.getByRole("button", { name: "Reset view", exact: true }).click();
  }
  await expect(
    page.getByText("Above-ground terrain only · no underground soil layers", {
      exact: true,
    }),
  ).toBeVisible();
  await capture("explorer");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await navigate("How it works");
  await expect(
    page.getByRole("heading", { name: "Know what is behind the insight." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your backend formulas", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read source documentation", exact: true }),
  ).toHaveCount(7);
  await expect(
    page
      .getByText("Decision support, not a guarantee.", { exact: true })
      .last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "اعرف ما وراء كل رؤية." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
