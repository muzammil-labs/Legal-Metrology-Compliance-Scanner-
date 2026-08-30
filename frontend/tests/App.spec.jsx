import { test, expect } from '@playwright/test';

test.describe('App Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the header and intro sections', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('LabelCheck India');
    await expect(page.locator('.eyebrow')).toContainText('DEPARTMENT OF CONSUMER AFFAIRS');
    await expect(page.locator('.brand strong')).toHaveText('LabelCheck India');
  });

  test('should switch tabs between consumer, officer, and seller', async ({ page }) => {
    // Initially on consumer tab
    await expect(page.locator('.tab-btn.active')).toContainText('Consumer Scanner');

    // Click Officer tab
    await page.click('button:has-text("Officer Heatmap")');
    await expect(page.locator('.tab-btn.active')).toContainText('Officer Heatmap');

    // Click Seller tab
    await page.click('button:has-text("Seller Batch")');
    await expect(page.locator('.tab-btn.active')).toContainText('Seller Batch');
  });

  test('should switch demo modes using the fixture segment control', async ({ page }) => {
    // Click P2 Tax Fail demo
    await page.click('button:has-text("P2 Tax Fail")');
    await expect(page.locator('.fixture-segment-btn.active')).toContainText('P2 Tax Fail');

    // Check if audit stamp updates
    await expect(page.locator('.audit-stamp b')).toHaveText('DEMO FIXTURE');
  });
});
