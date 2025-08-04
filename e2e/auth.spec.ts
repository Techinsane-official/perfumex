import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('admin can login and access dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/signin');
    
    // Fill login form
    await page.fill('input[name="username"]', 'mkalleche@gmail.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Should show admin navigation
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
  });

  test('buyer can login and access product catalog', async ({ page }) => {
    // Navigate to login
    await page.goto('/auth/signin');
    
    // Fill login form (buyer doesn't need password)
    await page.fill('input[name="username"]', 'buyer');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to products page
    await expect(page).toHaveURL('/products');
    
    // Should show products
    await expect(page.locator('text=Products')).toBeVisible();
  });

  test('unauthorized user cannot access admin routes', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/signin');
  });

  test('buyer cannot access admin routes', async ({ page }) => {
    // Login as buyer
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'buyer');
    await page.click('button[type="submit"]');
    
    // Try to access admin route
    await page.goto('/admin/dashboard');
    
    // Should be denied access
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });
});

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'mkalleche@gmail.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('admin can view products list', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Should show products table
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('admin can create new product', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Fill product form
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="brand"]', 'Test Brand');
    await page.fill('input[name="content"]', '100ml');
    await page.fill('input[name="ean"]', '1234567890123');
    await page.fill('input[name="purchasePrice"]', '10.00');
    await page.fill('input[name="retailPrice"]', '20.00');
    await page.fill('input[name="stockQuantity"]', '100');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to products list
    await expect(page).toHaveURL('/admin/products');
    
    // Should show success message
    await expect(page.locator('text=Product created successfully')).toBeVisible();
  });

  test('admin can edit product', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Click edit button on first product
    await page.click('button[aria-label="Edit"]');
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
    
    // Update product name
    await page.fill('input[name="name"]', 'Updated Product Name');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Product updated successfully')).toBeVisible();
  });
});

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'mkalleche@gmail.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('admin can view orders list', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Should show orders table
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('admin can approve order', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Find pending order and click approve
    await page.click('button[aria-label="Approve"]');
    
    // Should show success message
    await expect(page.locator('text=Order approved successfully')).toBeVisible();
  });

  test('admin can reject order', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Find pending order and click reject
    await page.click('button[aria-label="Reject"]');
    
    // Fill rejection reason
    await page.fill('textarea[name="rejectionReason"]', 'Out of stock');
    
    // Submit rejection
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Order rejected successfully')).toBeVisible();
  });
});

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'mkalleche@gmail.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('admin can view customers list', async ({ page }) => {
    await page.goto('/admin/customers');
    
    // Should show customers table
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('admin can create new customer', async ({ page }) => {
    await page.goto('/admin/customers/new');
    
    // Fill customer form
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="email"]', 'test@customer.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="address"]', 'Test Address');
    await page.fill('input[name="generalMargin"]', '15');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to customers list
    await expect(page).toHaveURL('/admin/customers');
    
    // Should show success message
    await expect(page.locator('text=Customer created successfully')).toBeVisible();
  });
});

test.describe('Product Catalog (Buyer)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as buyer
    await page.goto('/auth/signin');
    await page.fill('input[name="username"]', 'buyer');
    await page.click('button[type="submit"]');
  });

  test('buyer can view products with customer pricing', async ({ page }) => {
    await page.goto('/products');
    
    // Should show products
    await expect(page.locator('text=Products')).toBeVisible();
    
    // Should show customer-specific pricing
    await expect(page.locator('.customer-price')).toBeVisible();
  });

  test('buyer can filter products', async ({ page }) => {
    await page.goto('/products');
    
    // Open filters
    await page.click('button[aria-label="Filters"]');
    
    // Filter by brand
    await page.selectOption('select[name="brand"]', 'Test Brand');
    
    // Should show filtered results
    await expect(page.locator('text=Test Brand')).toBeVisible();
  });

  test('buyer can add products to order', async ({ page }) => {
    await page.goto('/products');
    
    // Add product to order
    await page.click('button[aria-label="Add to Order"]');
    
    // Should show order preview
    await expect(page.locator('text=Order Preview')).toBeVisible();
    
    // Should show added product
    await expect(page.locator('.order-item')).toBeVisible();
  });

  test('buyer can submit order', async ({ page }) => {
    await page.goto('/products');
    
    // Add product to order
    await page.click('button[aria-label="Add to Order"]');
    
    // Submit order
    await page.click('button[text="Submit Order"]');
    
    // Should show success message
    await expect(page.locator('text=Order submitted successfully')).toBeVisible();
  });
}); 