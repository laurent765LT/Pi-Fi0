import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display the login form', async ({ page }) => {
    await expect(page.getByText("Strick'in")).toBeVisible();
    await expect(page.getByPlaceholder('vous@exemple.fr')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('should show demo accounts section', async ({ page }) => {
    await page.getByText('Comptes demo').click();
    await expect(page.getByText('admin@strickin.com')).toBeVisible();
    await expect(page.getByText('cgp@demo.com')).toBeVisible();
  });

  test('should fill demo credentials on click', async ({ page }) => {
    await page.getByText('Comptes demo').click();
    await page.getByText('Admin').first().click();
    const emailInput = page.getByPlaceholder('vous@exemple.fr');
    await expect(emailInput).toHaveValue('admin@strickin.com');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('••••••••');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByLabel('Afficher le mot de passe').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should disable submit button without credentials', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: 'Se connecter' });
    await expect(submitBtn).toBeDisabled();
  });
});
