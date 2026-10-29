import { test, expect, type Page } from '@playwright/test';

const staff = {
  id: 11, organization_id: 7, staff_id: 'STAFF-SELF', name: 'Taylor Staff',
  email: 'taylor@example.test', phone: '+1-604-555-0101', address: '123 Test Avenue',
  designation: 'Senior Staff Nurse', department: 'Critical Care', supervisor: 'Emily Supervisor',
  contract_id: 'STATIC-7', skills: ['Critical Care Nursing', 'Patient Assessment'],
  certifications: ['Registered Nurse', 'ACLS'], roles: ['Charge Nurse', 'Senior Staff Nurse'],
  role_distribution: { 'Charge Nurse': 0.25, 'Senior Staff Nurse': 0.75 },
  pool_assignments: [{ pool_id: 'POOL-7', pool_name: 'Saved Pool Name' }],
  weekly_template: { monday: [{ start: '08:00', end: '16:00', role: 'Charge Nurse' }] },
  created_at: '2026-01-15T12:00:00Z', updated_at: '2026-09-10T12:00:00Z',
};

async function prepare(page: Page, options: { empty?: boolean; poolError?: boolean; missing?: boolean } = {}) {
  const writes: string[] = [];
  const orgQueries: string[] = [];
  let version = 0;
  await page.addInitScript(() => {
    localStorage.setItem('op.accessToken', 'fixture-token');
    localStorage.setItem('op.user', JSON.stringify({ id: 1, first_name: 'Taylor', email: 'taylor@example.test', role: 'USER', organization_id: 7 }));
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') writes.push(request.method());
    const path = url.pathname;
    if (options.poolError && path === '/api/pools') {
      await route.fulfill({ status: 500, json: { error: 'Pool service unavailable' } });
      return;
    }
    let data: unknown = [];
    if (path === '/api/staff') {
      orgQueries.push(url.searchParams.get('orgId') || '');
      version++;
      data = options.missing ? [{ ...staff, email: 'other@example.test', name: 'Other Person' }] : [{
        ...staff,
        ...(options.empty ? { skills: [], certifications: [], roles: [], role_distribution: {}, pool_assignments: [], weekly_template: {}, contract_id: null, phone: null, address: null, designation: null, department: null, supervisor: null } : {}),
        name: version > 1 ? 'Taylor Updated' : staff.name,
      }, { ...staff, id: 12, staff_id: 'STAFF-OTHER', email: 'other@example.test', name: 'Private Other Profile' }];
    }
    if (path === '/api/pools') {
      orgQueries.push(url.searchParams.get('orgId') || '');
      data = [{ pool_id: 'POOL-7', pool_name: 'Critical Care Pool', department: 'Critical Care', location: 'North Tower', primary_role: 'Charge Nurse' }];
    }
    if (path === '/api/contracts') {
      orgQueries.push(url.searchParams.get('orgId') || '');
      data = [{ contract_id: 'STATIC-7', name: 'Nurse Full Time', type: 'STATIC', status: 'Active' }];
    }
    if (path === '/api/staff-requests') data = [
      { id: 1, staff_id: staff.staff_id, status: 'APPROVED', request_category: 'LEAVE', leave_type_name: 'Annual Leave', start_date: '2099-11-12', end_date: '2099-11-14', shift: 'V' },
      { id: 2, staff_id: 'STAFF-OTHER', status: 'APPROVED', request_category: 'LEAVE', leave_type_name: 'Private Other Leave', start_date: '2099-11-12', end_date: '2099-11-14' },
      { id: 3, staff_id: staff.staff_id, status: 'PENDING', request_category: 'LEAVE', leave_type_name: 'Pending Leave', start_date: '2099-11-12', end_date: '2099-11-14' },
    ];
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/automation/fixtures/staff-requests.html', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'My Profile', exact: true }).click();
  return { writes, orgQueries };
}

test('staff profile displays saved details without calendar, weekly template, or edit controls', async ({ page }, testInfo) => {
  const { writes, orgQueries } = await prepare(page);
  await expect(page.getByRole('heading', { name: 'My Profile', exact: true })).toBeVisible();
  const personal = page.getByRole('region', { name: 'Personal & Contact Information' });
  await expect(personal).toContainText('taylor@example.test');
  await expect(personal).toContainText('+1-604-555-0101');
  await expect(personal).toContainText('123 Test Avenue');
  const employment = page.getByRole('region', { name: 'Employment & Contract' });
  await expect(employment).toContainText('Nurse Full Time');
  await expect(employment).toContainText('STATIC');
  await expect(employment).toContainText('Emily Supervisor');
  const pools = page.getByRole('region', { name: 'My Pools' });
  await expect(pools).toContainText('Critical Care Pool');
  await expect(pools).toContainText('North Tower');
  await expect(page.getByRole('region', { name: 'Skills & Certifications' })).toContainText('ACLS');
  await expect(page.getByRole('region', { name: 'Roles & Resource Distribution' })).toContainText('75%');
  await expect(page.getByText('Standard Weekly Template', { exact: true })).toHaveCount(0);
  await expect(page.getByText('08:00 - 16:00', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Employee Calendar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Employee Calendar', exact: true })).toHaveCount(0);
  const timeOff = page.getByRole('region', { name: 'Upcoming Time Off' });
  await expect(timeOff).toContainText('Annual Leave');
  await expect(timeOff).not.toContainText('Pending Leave');
  await expect(page.getByText('Private Other Profile', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Private Other Leave', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Edit Profile|Delete Profile|Save Template|Add Schedule/i })).toHaveCount(0);
  await expect(page.locator('main input, main textarea, main select')).toHaveCount(0);
  expect(writes).toEqual([]);
  expect(orgQueries.every(id => id === '7')).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('my-profile-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('main').evaluate(main => Math.round(main.getBoundingClientRect().left))).toBe(80);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Refresh profile', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Staff identity' })).toContainText('Taylor Updated');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Employee Calendar', exact: true })).toBeVisible();
});

test('missing profile fields have honest empty states and mobile layout stays inside the viewport', async ({ page }, testInfo) => {
  await prepare(page, { empty: true });
  await expect(page.getByRole('region', { name: 'My Pools' })).toContainText('No pools assigned.');
  await expect(page.getByRole('region', { name: 'Skills & Certifications' })).toContainText('No skills recorded.');
  await expect(page.getByRole('region', { name: 'Roles & Resource Distribution' })).toContainText('No roles or resource distribution recorded.');
  await expect(page.getByRole('region', { name: 'Employment & Contract' })).toContainText('Not recorded');
  await expect(page.getByText('General Medicine', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Clinical Staff', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Hospital Admin', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Staff identity' })).toContainText('Designation not recorded');
  await expect(page.getByRole('region', { name: 'Employment & Contract' })).not.toContainText('Emily Supervisor');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'My Profile', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('main').evaluate(main => Math.round(main.getBoundingClientRect().left))).toBe(80);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('my-profile-mobile.png'), fullPage: true });
});

test('related data failures are explicit while saved profile details remain available', async ({ page }) => {
  await prepare(page, { poolError: true });
  await expect(page.getByRole('alert')).toContainText('Unable to load pool details: Pool service unavailable');
  await expect(page.getByRole('region', { name: 'Personal & Contact Information' })).toContainText(staff.email);
  await expect(page.getByRole('region', { name: 'My Pools' })).toContainText('Saved Pool Name');
});

test('accounts without a linked staff profile cannot see someone else’s information', async ({ page }) => {
  await prepare(page, { missing: true });
  await expect(page.getByRole('alert')).toContainText('No staff profile is linked to this account');
  await expect(page.getByRole('region', { name: 'Personal & Contact Information' })).toHaveCount(0);
  await expect(page.getByText('Private Other Profile', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry loading profile' })).toBeVisible();
});
