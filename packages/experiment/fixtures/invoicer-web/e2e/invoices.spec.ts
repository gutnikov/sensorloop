import { expect, test } from '@playwright/test';

test('the filter narrows the invoice list as you type', async ({ page }) => {
  await page.goto('/invoices');
  const rows = page.locator('#invoices tbody tr');
  await expect(rows).toHaveCount(12);
  await page.getByLabel('Filter').fill('brightside');
  await expect(rows.filter({ visible: true })).toHaveCount(2);
  await page.getByLabel('Filter').fill('');
  await expect(rows.filter({ visible: true })).toHaveCount(12);
});

test('an invoice opens from the list', async ({ page }) => {
  await page.goto('/invoices');
  await page.getByRole('link', { name: 'INV-1001' }).click();
  await expect(page.getByRole('heading', { name: 'Invoice INV-1001' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Total/ })).toContainText('$3,252.48');
  await expect(page.getByText('Paid', { exact: true })).toBeVisible();
});
