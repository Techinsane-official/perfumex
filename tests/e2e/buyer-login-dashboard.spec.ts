import { test, expect } from "@playwright/test";

test.describe("Buyer Login and Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to buyer login page
    await page.goto("/login/buyer");
  });

  test("should display buyer login page correctly", async ({ page }) => {
    // Check page title and form elements
    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator("h1")).toContainText("Buyer Login");

    // Check form elements
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for markup explanation
    await expect(page.locator("text=+notatie")).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    // Fill login form
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to buyer dashboard
    await expect(page).toHaveURL("/dashboard");

    // Check dashboard elements
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator("text=Order History")).toBeVisible();
    await expect(page.locator("text=Pricing Summary")).toBeVisible();
  });

  test("should login with markup percentage", async ({ page }) => {
    // Login with 20% markup
    await page.fill('input[name="username"]', "buyer+20");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Check that markup is applied (prices should show markup)
    await expect(page.locator("text=20%")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Fill with invalid credentials
    await page.fill('input[name="username"]', "invalid");
    await page.fill('input[name="password"]', "wrong");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL("/login/buyer");
  });

  test("should show error for invalid markup format", async ({ page }) => {
    // Try invalid markup format
    await page.fill('input[name="username"]', "buyer+invalid");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show error about invalid markup
    await expect(page.locator("text=Invalid markup percentage")).toBeVisible();
  });

  test("should navigate through dashboard tabs", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Check all tabs are present
    await expect(page.locator("text=Order History")).toBeVisible();
    await expect(page.locator("text=Pricing Summary")).toBeVisible();
    await expect(page.locator("text=Review Management")).toBeVisible();
    await expect(page.locator("text=Notifications")).toBeVisible();
    await expect(page.locator("text=Downloads")).toBeVisible();

    // Click on Pricing Summary tab
    await page.click("text=Pricing Summary");

    // Should show pricing information
    await expect(page.locator("text=Total Margin")).toBeVisible();
    await expect(page.locator("text=Average Margin")).toBeVisible();
  });

  test("should display order history correctly", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Click on Order History tab
    await page.click("text=Order History");

    // Should show order history elements
    await expect(page.locator("text=Order #")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
    await expect(page.locator("text=Total")).toBeVisible();
    await expect(page.locator("text=Date")).toBeVisible();
  });

  test("should show review management interface", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Click on Review Management tab
    await page.click("text=Review Management");

    // Should show review management elements
    await expect(page.locator("text=My Reviews")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
    await expect(page.locator("text=Product")).toBeVisible();
  });

  test("should display notifications", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Click on Notifications tab
    await page.click("text=Notifications");

    // Should show notifications interface
    await expect(page.locator("text=Notifications")).toBeVisible();
  });

  test("should show downloads section", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Click on Downloads tab
    await page.click("text=Downloads");

    // Should show downloads interface
    await expect(page.locator("text=Invoices")).toBeVisible();
    await expect(page.locator("text=Download")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Find and click logout button/link
    const logoutButton = page
      .locator("text=Logout")
      .or(page.locator('a[href="/api/auth/signout"]'));
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should handle session timeout", async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Simulate session timeout by clearing cookies
    await page.context().clearCookies();

    // Try to access dashboard again
    await page.goto("/dashboard");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to login
    await page.goto("/login/buyer");

    // Check mobile layout
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Login
    await page.fill('input[name="username"]', "buyer+15");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Check mobile dashboard layout
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Order History")).toBeVisible();

    // Check that tabs are mobile-friendly
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible();
  });
});
