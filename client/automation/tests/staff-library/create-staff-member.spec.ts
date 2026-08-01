import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'nakulnshet1@gmail.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'nakul123';

test('Create Staff Member Andrian Dantis and validate in search table', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('textbox', { name: 'admin@centralhospital.com' }).click();
  await page.getByRole('textbox', { name: 'admin@centralhospital.com' }).fill(E2E_EMAIL);
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.waitForURL('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Staff Library' }).click();
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: 'Add Staff Member' }).click();
  await page.waitForTimeout(1500);

  await page.getByRole('textbox', { name: 'Dr. Julianne Mercer' }).click();
  await page.getByRole('textbox', { name: 'Dr. Julianne Mercer' }).fill('Andrian dantis');

  await page.locator('select').filter({ hasText: 'Select Professional Title...' }).selectOption('Senior Surgeon');

  await page.getByRole('textbox', { name: 'j.mercer@stprecision.org' }).click();
  await page.getByRole('textbox', { name: 'j.mercer@stprecision.org' }).fill('andrian.dantis@stprecision.org');

  await page.locator('select').filter({ hasText: 'Add Staff Type...' }).selectOption('Surgeon');
  await page.waitForTimeout(500);

  const departmentSelect = page.locator('select').filter({ hasText: /Select Department|No departments/ });
  if (await departmentSelect.isVisible()) {
    const options = await departmentSelect.locator('option').allInnerTexts();
    const validOption = options.find(o => o.trim() !== '' && !o.includes('Select Department') && !o.includes('No departments'));
    if (validOption) {
      await departmentSelect.selectOption(validOption.trim());
    }
  }
  await page.waitForTimeout(1000);

  const supervisorBtn = page.getByRole('button', { name: /Select a supervisor|Hospital Admin/i }).first();
  if (await supervisorBtn.isVisible()) {
    await supervisorBtn.click();
    await page.waitForTimeout(500);
    const defaultSupervisor = page.getByRole('button', { name: 'Default: Hospital Admin' });
    if (await defaultSupervisor.isVisible()) {
      await defaultSupervisor.click();
    } else {
      const overlay = page.locator('div.fixed.inset-0').first();
      if (await overlay.isVisible()) {
        await overlay.click({ force: true });
      }
    }
  }
  await page.waitForTimeout(500);

  const contractBtn = page.getByRole('button', { name: /Select an existing contract|STA|DYN/i }).first();
  if (await contractBtn.isVisible()) {
    await contractBtn.click();
    await page.waitForTimeout(800);
    const contractItem = page.locator('button', { hasText: /STA|DYN/ }).first();
    if (await contractItem.isVisible()) {
      await contractItem.click();
    } else {
      const overlay = page.locator('div.fixed.inset-0').first();
      if (await overlay.isVisible()) {
        await overlay.click({ force: true });
      }
    }
  }
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Add to HR Library' }).click();
  await page.waitForTimeout(3000);

  await page.getByRole('button', { name: 'Enable Filters' }).click();
  await page.waitForTimeout(500);

  await page.getByRole('textbox', { name: 'Filter name/title' }).click();
  await page.getByRole('textbox', { name: 'Filter name/title' }).fill('Andrian dantis');
  await page.waitForTimeout(1000);

  await expect(page.getByText('Andrian dantis', { exact: false }).first()).toBeVisible();
});