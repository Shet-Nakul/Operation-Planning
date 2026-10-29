import { test, expect, type Page } from '@playwright/test';

const organization = { id: 1, name: 'Test Hospital' };
const role = { id: 2, name: 'USER' };

async function prepare(page: Page, directory: 'users' | 'activity', fail = false) {
  const users = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1, first_name: `Staff${index + 1}`, last_name: 'Member',
    email: `staff${index + 1}@example.test`, role_id: role.id, role,
    organization_id: organization.id, organization, is_active: index % 2 === 0,
  }));
  const logs = Array.from({ length: 25 }, (_, index) => ({
    id: index + 1, user: users[index], action: index % 2 ? 'UPDATE' : 'CREATE',
    entity: 'Staff', entity_id: String(index + 1), description: `Updated staff record ${index + 1}`,
    organization, metadata: { record: index + 1 }, created_at: '2026-10-29T04:30:00Z',
  }));
  await page.addInitScript(() => {
    localStorage.setItem('op.accessToken', 'fixture-token');
    localStorage.setItem('op.user', JSON.stringify({ id: 99, first_name: 'Admin', email: 'admin@example.test', role: 'ADMIN', organization_id: 1 }));
  });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (fail && (path === '/api/users' || path === '/api/activity-logs')) {
      await route.fulfill({ status: 500, json: { error: 'Unable to load directory' } });
      return;
    }
    let data: unknown = [];
    if (path === '/api/roles') data = [role];
    if (path === '/api/organizations') data = { data: [organization], pagination: { total: 1, totalPages: 1 } };
    if (path === '/api/users' && method === 'POST') {
      const created = { ...users[0], ...route.request().postDataJSON(), id: 100 };
      users.unshift(created);
      data = { ...created, credentials: { email: created.email, password: 'fixture-only-not-a-real-password' } };
    } else if (path.startsWith('/api/users/') && method === 'PUT') {
      const id = Number(path.split('/').pop());
      const user = users.find(user => user.id === id)!;
      Object.assign(user, route.request().postDataJSON());
      data = user;
    } else if (path.startsWith('/api/users/') && method === 'DELETE') {
      const id = Number(path.split('/').pop());
      users.splice(users.findIndex(user => user.id === id), 1);
      await route.fulfill({ status: 204 });
      return;
    } else if (path === '/api/users' || path === '/api/activity-logs') {
      const items = path === '/api/users' ? users : logs;
      const currentPage = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 20);
      const pagination = { page: currentPage, limit, total: items.length, totalPages: Math.ceil(items.length / limit) };
      await route.fulfill({ json: { data: items.slice((currentPage - 1) * limit, currentPage * limit), pagination } });
      return;
    }
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto(`/automation/fixtures/admin-directories.html?page=${directory}`, { waitUntil: 'domcontentloaded' });
}

test('Users has directory table styling, search, server pagination, and organization controls', async ({ page }, testInfo) => {
  await prepare(page, 'users');
  const table = page.getByRole('table', { name: 'Users', exact: true });
  await expect(table.getByRole('columnheader')).toHaveText(['User ID', 'Name & Email', 'Role', 'Organization', 'Password', 'Status', 'Actions']);
  await expect(table.getByRole('row')).toHaveCount(21);
  await expect(page.getByRole('region', { name: 'User overview' })).toContainText('25');
  await page.getByRole('button', { name: 'Next users page' }).click();
  await expect(table.getByRole('row')).toHaveCount(6);
  await expect(table.getByText('staff25@example.test', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous users page' }).click();
  await page.getByRole('searchbox', { name: 'Search users on this page' }).fill('staff2@example.test');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search users on this page' }).fill('missing-person');
  await expect(table.getByText('No users found.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search users on this page' }).clear();
  await page.getByRole('combobox', { name: 'Users per page' }).selectOption('50');
  await expect(table.getByRole('row')).toHaveCount(26);
  await page.getByRole('combobox', { name: 'Filter users by organization' }).selectOption('1');
  await expect(table.getByRole('row')).toHaveCount(26);
  await page.screenshot({ path: testInfo.outputPath('users-desktop.png'), fullPage: true });
});

test('User creation, inline editing, cancellation, and deletion remain functional', async ({ page }) => {
  await prepare(page, 'users');
  const create = page.getByRole('region', { name: 'Create User', exact: true });
  await create.getByRole('textbox', { name: 'New user first name' }).fill('NewStaff');
  await create.getByRole('textbox', { name: 'New user email' }).fill('newstaff@example.test');
  await create.getByRole('button', { name: 'Add', exact: true }).click();
  const table = page.getByRole('table', { name: 'Users', exact: true });
  const row = table.getByRole('row').filter({ hasText: 'newstaff@example.test' }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('textbox', { name: 'Edit user first name' }).fill('ChangedStaff');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(row).toContainText('ChangedStaff');
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Edit user first name' })).toHaveCount(0);
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(table.getByText('newstaff@example.test', { exact: true })).toHaveCount(0);
});

test('Activity Log preserves searching, pagination, row details, and keyboard-accessible detail actions', async ({ page }, testInfo) => {
  await prepare(page, 'activity');
  const table = page.getByRole('table', { name: 'Activity log', exact: true });
  await expect(table.getByRole('columnheader')).toHaveText(['Time', 'User', 'Action', 'Entity', 'Entity ID', 'Description', 'Details']);
  await expect(table.getByRole('row')).toHaveCount(21);
  await page.getByRole('button', { name: 'Next events page' }).click();
  await expect(table.getByRole('row')).toHaveCount(6);
  await page.getByRole('button', { name: 'View activity 21', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Activity Details' });
  await expect(dialog).toContainText('Updated staff record 21');
  await expect(dialog).toContainText('"record": 21');
  await page.getByRole('button', { name: 'Close activity details' }).press('Escape');
  await expect(dialog).toHaveCount(0);
  await table.getByRole('row').nth(1).click();
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close activity details' }).click();
  await page.getByRole('button', { name: 'Previous events page' }).click();
  await page.getByRole('searchbox', { name: 'Search activity on this page' }).fill('staff2@example.test');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Search activity on this page' }).fill('no matching event');
  await expect(table.getByText('No activity found.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search activity on this page' }).clear();
  await page.getByRole('combobox', { name: 'Activity events per page' }).selectOption('50');
  await expect(table.getByRole('row')).toHaveCount(26);
  await page.screenshot({ path: testInfo.outputPath('activity-desktop.png'), fullPage: true });
});

for (const directory of ['users', 'activity'] as const) {
  test(`${directory} displays errors and confines wide tables to scrollable cards on mobile`, async ({ page }, testInfo) => {
    await prepare(page, directory);
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    const table = page.getByRole('table', { name: directory === 'users' ? 'Users' : 'Activity log', exact: true });
    await expect(table.getByRole('row')).toHaveCount(21);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await table.evaluate(table => table.parentElement!.scrollWidth > table.parentElement!.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${directory}-mobile.png`), fullPage: true });
    await prepare(page, directory, true);
    await expect(page.getByRole('alert')).toHaveText('Unable to load directory');
  });
}
