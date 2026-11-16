import { expect, test } from '@playwright/test';

test('the customers page shows what each customer owes', async ({ page }) => {
  await page.goto('/invoices');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Customers' }).click();
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Acme Tools/ })).toContainText('$2,394.00');
});
