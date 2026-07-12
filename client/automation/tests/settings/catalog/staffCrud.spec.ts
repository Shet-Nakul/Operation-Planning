import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'admin@centralhospital.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

test('CRUD Operation for Staff Tags', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'admin@centralhospital.com' }).click();
  await page.getByRole('textbox', { name: 'admin@centralhospital.com' }).fill(E2E_EMAIL);
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Catalogs Master data and' }).click();
  await page.getByRole('button', { name: 'Staff Tags' }).click();
  await page.getByRole('textbox', { name: 'e.g. Surgeon' }).click();
  await page.getByRole('textbox', { name: 'e.g. Surgeon' }).fill('Test Surgeon');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Test Surgeon')).toBeVisible();
  await page.locator('div:nth-child(8) > .flex.items-start > .flex.items-center.gap-2 > .p-2.rounded-xl.bg-white.border.border-slate-200.text-slate-500.hover\\:text-slate-700').click();
  await page.getByRole('textbox').nth(2).click();
  await page.getByRole('textbox').nth(2).press('ControlOrMeta+a');
  await page.getByRole('textbox').nth(2).fill('Test Suregon Main');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Test Suregon Main')).toBeVisible();
  await page.locator('div:nth-child(8) > .flex.items-start > .flex.items-center.gap-2 > .p-2.rounded-xl.bg-white.border.border-slate-200.text-slate-500.hover\\:text-error').click();
  await page.getByRole('button', { name: 'Delete' }).click();
});