import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Check if the page loads
    await expect(page).toHaveTitle(/Project X/);

    // Check for main content
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have proper navigation", async ({ page }) => {
    await page.goto("/");

    // Check for navigation elements
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("main")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("main")).toBeVisible();
  });
});
