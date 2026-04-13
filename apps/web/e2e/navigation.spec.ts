import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display landing page at root', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("Strick'in")).toBeVisible();
  });
});
