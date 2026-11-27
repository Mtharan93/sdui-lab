// Minimal E2E smoke test — verifies the page title during M1
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/sdui-lab/i);
  await expect(page.getByRole('heading', { name: /sdui-lab/i })).toBeVisible();
});
