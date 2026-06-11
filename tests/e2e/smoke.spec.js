// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads and field SVG is present', async ({ page }) => {
    await page.goto('/');

    const fieldSvg = page.locator('#field-svg');
    await expect(fieldSvg).toBeVisible();
    await expect(fieldSvg).toHaveAttribute('viewBox', '0 0 105 68');
  });

  test('all three format buttons are clickable and switch active format', async ({ page }) => {
    await page.goto('/');

    // Click 7v7
    const btn7 = page.locator('#btn-7v7');
    await btn7.click();
    await expect(btn7).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-9v9')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btn-11v11')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#active-format-label')).toContainText('7v7');

    // Click 9v9
    const btn9 = page.locator('#btn-9v9');
    await btn9.click();
    await expect(btn9).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-7v7')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btn-11v11')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#active-format-label')).toContainText('9v9');

    // Click 11v11
    const btn11 = page.locator('#btn-11v11');
    await btn11.click();
    await expect(btn11).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-7v7')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btn-9v9')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#active-format-label')).toContainText('11v11');
  });

  test('default format is 11v11 on first load (no localStorage)', async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('#btn-11v11')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#active-format-label')).toContainText('11v11');
  });

  test('tokens are draggable on desktop viewport', async ({ page }) => {
    await page.goto('/');

    // Wait for tokens to render
    const token = page.locator('#tokens-layer g').first();
    await expect(token).toBeVisible();

    // Get initial position
    const box = await token.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const endX = startX + 40;
    const endY = startY + 40;

    // Perform drag via pointer events
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.mouse.up();

    // Verify position changed
    const newBox = await token.boundingBox();
    expect(newBox).not.toBeNull();
    // The token should have moved from its original position
    const moved = Math.abs(newBox.x - box.x) > 1 || Math.abs(newBox.y - box.y) > 1;
    expect(moved).toBe(true);
  });

  test('tokens are draggable on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');

    // Wait for tokens to render
    const token = page.locator('#tokens-layer g').first();
    await expect(token).toBeVisible();

    // Get initial position
    const box = await token.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const endX = startX + 30;
    const endY = startY + 30;

    // Simulate touch drag via pointer events
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.mouse.up();

    // Verify position changed
    const newBox = await token.boundingBox();
    expect(newBox).not.toBeNull();
    const moved = Math.abs(newBox.x - box.x) > 1 || Math.abs(newBox.y - box.y) > 1;
    expect(moved).toBe(true);

    await context.close();
  });

  test('localStorage persists data across page reloads', async ({ page }) => {
    await page.goto('/');

    // Switch to 7v7 format — this should persist to localStorage
    await page.locator('#btn-7v7').click();
    await expect(page.locator('#btn-7v7')).toHaveAttribute('aria-pressed', 'true');

    // Verify localStorage was written
    const storedFormat = await page.evaluate(() => localStorage.getItem('sft.v1.format'));
    expect(storedFormat).toBe('7v7');

    // Reload the page
    await page.reload();

    // Verify the format persisted
    await expect(page.locator('#btn-7v7')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#active-format-label')).toContainText('7v7');
  });
});
