import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/resources/pools/EQ-1', route => route.fulfill({
    json: {
      pool_id: 'EQ-1', pool_name: 'IV Pump Pool', resource_type: 'EQUIPMENT',
      units: [{ unit_id: 'UNIT-1', current_status: 'AVAILABLE' }, { unit_id: 'UNIT-2', current_status: 'AVAILABLE' }],
    },
  }));
  await page.goto('/automation/fixtures/phase-resources.html');
  await expect(page.getByRole('heading', { name: 'Phase Resource Configuration' })).toBeVisible();
});

test('staff and human pools match the role across all departments; a whole pool fills all slots', async ({ page }) => {
  await page.getByRole('button', { name: 'Manage', exact: true }).first().click();
  // No department selector in the assignment modal any more.
  await expect(page.getByText('Department', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Select staff', exact: true }).click();
  // Scrub Nurse staff from any department match; the Recovery Nurse does not.
  await expect(page.getByRole('button', { name: 'Scrub Nurse 1 · Scrub Nurse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scrub Nurse 3 · Scrub Nurse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Recovery Nurse 2/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Scrub Nurse 1 · Scrub Nurse', exact: true }).click();
  await expect(page.getByTestId('payload')).toContainText('"assigned":"STAFF-1","count":1');

  await page.getByRole('button', { name: 'Pool', exact: true }).click();
  await page.getByRole('button', { name: 'Select pool', exact: true }).click();
  await expect(page.getByRole('button', { name: 'OR Scrub Pool · Scrub Nurse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Night Scrub Pool · Scrub Nurse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Recovery Nurse Pool|IV Pump Pool/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'OR Scrub Pool · Scrub Nurse', exact: true }).click();
  await page.getByRole('button', { name: 'Add pool (solver selects staff)', exact: true }).click();
  await expect(page.getByTestId('payload')).toContainText('"assigned":"HR-1","count":3');
  await expect(page.getByRole('button', { name: 'Add pool (solver selects staff)', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Manage', exact: true }).first().click();
  await expect(page.getByText('Scrub Team (3/3)', { exact: true })).toBeVisible();
});

test('equipment is matched by its derived role (not just resource type) and supports units or a whole pool', async ({ page }) => {
  await page.getByRole('button', { name: 'Manage', exact: true }).nth(1).click();
  // Personnel toggles are hidden for equipment resources.
  await expect(page.getByRole('button', { name: 'Staff', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pool', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Select equipment pool', exact: true }).click();
  // Only the IV Pump pool matches; the other EQUIPMENT pool and the BED pool do not.
  await expect(page.getByRole('button', { name: 'IV Pump Pool · EQUIPMENT', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Surgical Light Pool|ICU Bed Pool|OR Scrub Pool/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'IV Pump Pool · EQUIPMENT', exact: true }).click();

  await page.getByRole('button', { name: 'Select resource', exact: true }).click();
  await page.getByRole('button', { name: 'UNIT-1 · AVAILABLE', exact: true }).click();
  await expect(page.getByTestId('payload')).toContainText('"assigned":"UNIT-1","count":1');
  await expect(page.getByRole('button', { name: 'Add pool (solver selects equipment)', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: 'Clear All', exact: true }).click();
  await page.getByRole('button', { name: 'Add pool (solver selects equipment)', exact: true }).click();
  await expect(page.getByTestId('payload')).toContainText('"assigned":"EQ-1","count":2');
});

test('sterilization uses the same role filtering and whole-count pool assignment', async ({ page }) => {
  await page.getByRole('button', { name: 'Manage', exact: true }).last().click();
  await page.getByRole('button', { name: 'Pool', exact: true }).click();
  await page.getByRole('button', { name: 'Select pool', exact: true }).click();
  await page.getByRole('button', { name: 'OR Scrub Pool · Scrub Nurse', exact: true }).click();
  await page.getByRole('button', { name: 'Add pool (solver selects staff)', exact: true }).click();
  await expect(page.getByTestId('payload')).toContainText('"sterilization":[{"role":"Scrub Nurse","assigned":"HR-1","count":2');
});
