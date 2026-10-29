import { test, expect, type Page } from '@playwright/test';

const member = { id: 1, organization_id: 1, staff_id: 'STAFF-1', name: 'Test Staff', email: 'staff@example.test', designation: 'Nurse', supervisor: 'Test Supervisor', pool_assignments: [] };
const pendingSwap = {
  id: 1, staff_id: 'STAFF-2', staff_name: 'Direct Report', request_category: 'SHIFT',
  leave_type_name: null, shift: 'E', start_date: '2026-11-12', end_date: '2026-11-12',
  status: 'PENDING', reason: 'Family event', can_review: true, created_at: '2026-10-29T00:00:00Z',
  metadata: { swap: true, stage: 'SUPERVISOR', target_colleague_name: 'Colleague' },
};

async function prepare(page: Page, role = 'USER', requests: object[] = [], rejectSubmission = false, reports: object[] = []) {
  await page.addInitScript(role => {
    localStorage.setItem('op.accessToken', 'fixture-token');
    localStorage.setItem('op.user', JSON.stringify({ id: 1, first_name: 'Test', email: 'staff@example.test', organization_id: 1, role }));
  }, role);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = [];
    if (path === '/api/staff') data = [member];
    if (path === '/api/catalogs/leave_types') data = [{ name: 'Vacation', status: 'ACTIVE' }];
    if (path === '/api/staff-requests/team') data = { own_staff: [member], staff: reports };
    if (path === '/api/staff-requests') {
      if (route.request().method() === 'POST') {
        if (rejectSubmission) {
          await route.fulfill({ status: 400, json: { error: 'No active supervisor account is linked' } });
          return;
        }
        data = { ...route.request().postDataJSON(), id: 3, staff_name: member.name, status: 'PENDING', can_review: false, created_at: '2026-10-29T00:00:00Z' };
        requests.push(data as object);
      } else data = url.searchParams.has('staffId') ? requests.filter(request => (request as { staff_id: string }).staff_id === url.searchParams.get('staffId')) : requests;
    }
    if (path === '/api/staff-requests/1' && route.request().method() === 'PUT') {
      const request = requests[0] as typeof pendingSwap;
      request.can_review = false;
      if (role === 'ADMIN') request.status = 'APPROVED';
      else request.metadata.stage = 'ADMIN';
      data = request;
    }
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/automation/fixtures/staff-requests.html', { waitUntil: 'domcontentloaded' });
}

test('personal requests move out of Overview and remain visible in My Request after submission', async ({ page }) => {
  await prepare(page);
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Personal requests' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Pending Requests' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Request Center', exact: true }).click();
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await page.locator('input[type=date]').nth(0).fill('2026-11-12');
  await page.locator('input[type=date]').nth(1).fill('2026-11-14');
  await page.getByRole('button', { name: 'Submit Request', exact: true }).click();
  const confirmation = page.getByRole('status').filter({ hasText: 'Leave request has been sent to your manager.' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toHaveClass(/bg-emerald-50/);
  await page.getByRole('button', { name: 'My Request', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Leave', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Shift Swap', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View All Activity', exact: true })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Personal requests' }).getByRole('cell', { name: 'Vacation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'My Team', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No direct reports' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Staff requests', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve request for Test Staff' })).toHaveCount(0);
  await page.getByRole('button', { name: 'My Request', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Personal requests' }).getByRole('cell', { name: 'Vacation', exact: true })).toBeVisible();
});

test('Home focuses on the employee calendar and the old Home content lives in Request Center', async ({ page }) => {
  await prepare(page);
  await expect(page.getByRole('region', { name: 'Employee Calendar', exact: true })).toBeVisible();
  await expect(page.getByText('No saved roster assignments for this staff member.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leave', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Shift Swap', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Administrative Requests', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Request Center', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Request Center', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leave', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Shift Swap', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Administrative Requests', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Employee Calendar', exact: true })).toBeVisible();
});

test('Request Center removes policy updates and gives the calendar full width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await prepare(page);
  await page.getByRole('button', { name: 'Request Center', exact: true }).click();
  const calendar = page.getByRole('region', { name: 'Schedule & Time-Off', exact: true });
  await expect(calendar).toBeVisible();
  await expect(page.getByText('Policy Update', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Learn More', exact: true })).toHaveCount(0);
  await expect.poll(() => calendar.evaluate(element => {
    const container = element.parentElement?.parentElement;
    return container ? Math.abs(element.getBoundingClientRect().width - container.getBoundingClientRect().width) : -1;
  })).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('main').evaluate(main => Math.round(main.getBoundingClientRect().left))).toBe(80);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(calendar).toBeVisible();
});

test('Home and the admin staff calendar display the same merged assignments and approved leave', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00Z'));
  const leave = { ...structuredClone(pendingSwap), id: 2, staff_id: member.staff_id, staff_name: member.name, request_category: 'LEAVE', shift: null, leave_type_name: 'Vacation', status: 'APPROVED', can_review: false, metadata: null, start_date: '2026-11-13', end_date: '2026-11-14' };
  await prepare(page, 'USER', [leave]);
  await page.route('**/api/rosterings?**', route => route.fulfill({ json: { success: true, data: [
    { id: 2, organization_id: 1, year: 2026, month: 10, created_at: '2026-10-02T00:00:00Z', employee_centric: { 'STAFF-1': { '2026-11-12': { shift: 'N', pool: 'POOL-2' } } } },
    { id: 1, organization_id: 1, year: 2026, month: 10, created_at: '2026-10-01T00:00:00Z', employee_centric: { 'STAFF-1': { '2026-11-12': { shift: 'D', pool: 'POOL-1' }, '2026-12-01': { shift: 'D', pool: 'POOL-1' } }, OTHER: { '2026-11-15': { shift: 'N', pool: 'OTHER-POOL' } } } },
  ] } }));
  await page.route('**/api/catalogs/shift?**', route => route.fulfill({ json: { success: true, data: [
    { id: 1, organization_id: 1, name: 'Night', alias: 'N', start_time: '20:00', end_time: '08:00' },
    { id: 2, organization_id: 1, name: 'Day', alias: 'D', start_time: '08:00', end_time: '20:00' },
  ] } }));
  await page.reload();
  const calendar = page.getByRole('region', { name: 'Employee Calendar', exact: true });
  const assignment = calendar.getByRole('button', { name: 'Assignments for 2026-11-12', exact: true });
  await expect(assignment).toContainText('Night');
  await expect(assignment).toContainText('POOL-2');
  await expect(assignment).toContainText('20:00 - 08:00');
  await expect(calendar.getByRole('button', { name: 'Assignments for 2026-11-13', exact: true })).toContainText('Leave');
  await expect(calendar.getByRole('button', { name: 'Assignments for 2026-11-15', exact: true })).not.toContainText('OTHER-POOL');
  await assignment.click();
  await expect(calendar.getByText('Shift: Night (N)', { exact: true })).toBeVisible();
  await calendar.getByRole('button', { name: 'Next calendar month', exact: true }).click();
  await expect(calendar.getByRole('button', { name: 'Assignments for 2026-12-01', exact: true })).toContainText('Day');
  await calendar.getByRole('button', { name: 'Previous calendar month', exact: true }).click();
  const staffMarkup = await calendar.innerHTML();
  await page.screenshot({ path: testInfo.outputPath('staff-home-calendar.png'), fullPage: true });
  await page.goto('/automation/fixtures/staff-requests.html?admin-calendar', { waitUntil: 'domcontentloaded' });
  await expect(assignment).toContainText('Night');
  await assignment.click();
  await expect(calendar.getByText('Shift: Night (N)', { exact: true })).toBeVisible();
  expect(await calendar.innerHTML()).toBe(staffMarkup);
});

test('staff calendars initially select today even when saved requests are in a different month', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-29T12:00:00Z'));
  const leave = { ...structuredClone(pendingSwap), staff_id: member.staff_id, staff_name: member.name, request_category: 'LEAVE', status: 'APPROVED', shift: 'V', metadata: null };
  await prepare(page, 'USER', [leave]);
  await page.route('**/api/rosterings?**', route => route.fulfill({ json: { success: true, data: [
    { id: 1, organization_id: 1, year: 2026, month: 11, created_at: '2026-10-01T00:00:00Z', employee_centric: { 'STAFF-1': { '2026-11-12': { shift: 'D', pool: 'POOL-1' } } } },
  ] } }));
  await page.reload();
  const home = page.getByRole('region', { name: 'Employee Calendar', exact: true });
  await expect(home.getByRole('button', { name: 'Assignments for 2026-10-29', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(home.getByRole('button', { pressed: true })).toHaveCount(1);
  await expect(home.getByText('Leave', { exact: true })).toBeVisible();
  await home.getByRole('button', { name: 'Next calendar month', exact: true }).click();
  await expect(home.getByRole('button', { name: 'Assignments for 2026-11-29', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Request Center', exact: true }).click();
  const calendar = page.getByRole('region', { name: 'Schedule & Time-Off', exact: true });
  const today = calendar.getByRole('button', { name: 'Schedule for 2026-10-29', exact: true });
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await expect(calendar.getByRole('button', { pressed: true })).toHaveCount(1);
  await calendar.getByRole('button', { name: 'Schedule for 2026-10-15', exact: true }).click();
  await expect(today).toHaveAttribute('aria-pressed', 'false');
  await calendar.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(calendar.getByRole('button', { pressed: true })).toHaveCount(0);
  await calendar.getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(calendar.getByRole('button', { name: 'Schedule for 2026-10-15', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Home shows calendar load errors explicitly', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/rosterings?**', route => route.fulfill({ status: 500, json: { error: 'Calendar temporarily unavailable' } }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Calendar temporarily unavailable');
});

test('failed leave submissions show the error without a success banner', async ({ page }) => {
  await prepare(page, 'USER', [], true);
  await page.getByRole('button', { name: 'Request Center', exact: true }).click();
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await page.locator('input[type=date]').nth(0).fill('2026-11-12');
  await page.locator('input[type=date]').nth(1).fill('2026-11-14');
  await page.getByRole('button', { name: 'Submit Request', exact: true }).click();
  await expect(page.getByText('No active supervisor account is linked', { exact: true })).toBeVisible();
  await expect(page.getByText('Leave request has been sent to your manager.', { exact: true })).toHaveCount(0);
});

test('staff sidebar collapses, keeps sign out at bottom-left, and shows the avatar after the name', async ({ page }) => {
  await prepare(page);
  const sidebar = page.locator('aside');
  await expect(sidebar.getByRole('img', { name: 'Karmarker logo' })).toBeVisible();
  await expect(sidebar.getByText('Staff Portal', { exact: true })).toBeVisible();
  const nameBox = await sidebar.getByText('Karmarker', { exact: true }).boundingBox();
  const subtitleBox = await sidebar.getByText('Staff Portal', { exact: true }).boundingBox();
  expect(subtitleBox!.x).toBe(nameBox!.x);
  expect(subtitleBox!.y).toBeGreaterThan(nameBox!.y);
  const signOut = sidebar.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  expect(await signOut.evaluate(button => button.getBoundingClientRect().top > window.innerHeight - 150)).toBe(true);
  await expect(page.locator('header').getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  expect(await page.getByLabel('Profile avatar').evaluate(avatar => avatar.previousElementSibling?.textContent?.includes('Test'))).toBe(true);
  await sidebar.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
  await expect(sidebar).toHaveClass(/w-20/);
  await expect(sidebar.getByText('Karmarker', { exact: true })).toBeHidden();
  await expect(signOut).toBeVisible();
  await sidebar.getByRole('button', { name: 'My Request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Request', exact: true })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Expand sidebar', exact: true }).click();
  await expect(sidebar.getByText('Karmarker', { exact: true })).toBeVisible();
});

test('personal request status refreshes on focus without showing rejected requests as editable drafts', async ({ page }) => {
  const request = { ...structuredClone(pendingSwap), staff_id: member.staff_id, staff_name: member.name, can_review: false };
  await prepare(page, 'USER', [request]);
  await page.getByRole('button', { name: 'My Request', exact: true }).click();
  const personal = page.getByRole('table', { name: 'Personal requests', exact: true });
  await expect(personal.getByText('Awaiting supervisor', { exact: true })).toBeVisible();
  request.status = 'REJECTED';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(personal.getByText('Rejected', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume Editing' })).toHaveCount(0);
});

test('supervisors see only personal requests in My Request and reportee requests in My Team', async ({ page }) => {
  const ownRequest = { ...structuredClone(pendingSwap), id: 2, staff_id: member.staff_id, staff_name: member.name, can_review: false };
  await prepare(page, 'USER', [ownRequest, structuredClone(pendingSwap)], false, [{ ...member, id: 2, staff_id: 'STAFF-2', name: 'Direct Report' }]);
  await page.getByRole('button', { name: 'My Request', exact: true }).click();
  const personal = page.getByRole('table', { name: 'Personal requests', exact: true });
  await expect(personal.getByText(member.name, { exact: true })).toBeVisible();
  await expect(personal.getByText('Direct Report', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^My Team/ }).click();
  const teamRequests = page.getByRole('table', { name: 'Staff requests', exact: true });
  await expect(teamRequests.getByText('Direct Report', { exact: true })).toBeVisible();
  await expect(teamRequests.getByText(member.name, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Direct reports', exact: true })).toBeVisible();
});

test('a user supervisor sees a red actionable count and forwards swaps to the admin', async ({ page }) => {
  await prepare(page, 'USER', [structuredClone(pendingSwap)], false, [{ ...member, id: 2, staff_id: 'STAFF-2', name: 'Direct Report' }]);
  const team = page.getByRole('button', { name: 'My Team, 1 requests require approval' });
  await expect(team.locator('span.bg-red-600')).toHaveText('1');
  await team.click();
  await page.getByRole('button', { name: 'Approve request for Direct Report' }).click();
  await expect(page.getByRole('cell', { name: 'Awaiting hospital admin', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'My Team', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve request for Direct Report' })).toHaveCount(0);
});

test('admins without direct reports have My Team and can give final swap approval', async ({ page }) => {
  const request = structuredClone(pendingSwap);
  request.metadata.stage = 'ADMIN';
  await prepare(page, 'ADMIN', [request]);
  const team = page.getByRole('button', { name: 'My Team, 1 requests require approval' });
  await expect(team.locator('span.bg-red-600')).toHaveText('1');
  await page.getByRole('button', { name: 'Approve request for Direct Report' }).click();
  await expect(page.getByRole('button', { name: 'My Team', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Request status' }).selectOption('APPROVED');
  await expect(page.getByRole('cell', { name: 'Approved', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Rostering for the affected pools has been queued.');
});

test('admin inbox refreshes from supervisor waiting to actionable final approval', async ({ page }) => {
  const request = { ...structuredClone(pendingSwap), can_review: false };
  await prepare(page, 'ADMIN', [request]);
  await expect(page.getByRole('cell', { name: 'Awaiting supervisor', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve request for Direct Report' })).toHaveCount(0);
  request.metadata.stage = 'ADMIN';
  request.can_review = true;
  await page.evaluate(() => window.dispatchEvent(new Event('staff-requests-changed')));
  await expect(page.getByRole('cell', { name: 'Awaiting hospital admin', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Approve request for Direct Report' }).click();
  await expect(page.getByRole('status')).toContainText('Shift swap approved.');
  await page.getByRole('combobox', { name: 'Request status' }).selectOption('APPROVED');
  await expect(page.getByRole('cell', { name: 'Approved', exact: true })).toBeVisible();
});

test('approved swap calendar uses the preferred shift instead of the original shift', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00Z'));
  const request = {
    ...structuredClone(pendingSwap), staff_id: member.staff_id, staff_name: member.name, status: 'APPROVED', can_review: false,
    metadata: { ...pendingSwap.metadata, stage: 'ADMIN', preferred_shift: 'N', own_shift: 'E' },
  };
  await prepare(page, 'USER', [request]);
  const day = page.getByRole('button', { name: 'Assignments for 2026-11-12', exact: true });
  await expect(day).toContainText('N');
  await day.click();
  await expect(page.getByText('Shift: N (N)', { exact: true })).toBeVisible();
});

test('approval counts refresh on focus and exclude requests assigned to someone else', async ({ page }) => {
  const requests = [{ ...structuredClone(pendingSwap), can_review: false }];
  await prepare(page, 'USER', requests);
  await expect(page.getByRole('button', { name: 'My Team', exact: true })).toBeVisible();
  requests.push({ ...structuredClone(pendingSwap), id: 2 });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const team = page.getByRole('button', { name: 'My Team, 1 requests require approval' });
  await expect(team.locator('span.bg-red-600')).toHaveText('1');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(team).toBeVisible();
  await expect(team.locator('span.bg-red-600')).toBeVisible();
});

test('My Team uses directory-style tables with searchable, paginated requests', async ({ page }, testInfo) => {
  const requests = Array.from({ length: 12 }, (_, index) => ({
    ...structuredClone(pendingSwap), id: index + 1, staff_id: `STAFF-${index + 10}`,
    staff_name: `Staff Member ${index + 1}`, staff_designation: 'Senior Staff Nurse',
    staff_department: 'Critical Care', can_review: false,
  }));
  await prepare(page, 'ADMIN', requests);
  const table = page.getByRole('table', { name: 'Staff requests', exact: true });
  await expect(table.getByRole('columnheader')).toHaveText(['Staff ID', 'Name & Professional Title', 'Request', 'Dates & Reason', 'Status', 'Decision']);
  await expect(table.getByRole('row')).toHaveCount(11);
  await page.getByRole('button', { name: 'Next requests page', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByText('Staff Member 12', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search staff requests' }).fill('STAFF-10');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Previous requests page', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Search staff requests' }).fill('no match');
  await expect(table.getByText('No matching requests', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search staff requests' }).fill('');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('my-team-desktop.png'), fullPage: true });
});

test('direct reports use staff identity columns and table scrolling stays within the card on mobile', async ({ page }, testInfo) => {
  await prepare(page, 'USER', [structuredClone(pendingSwap)]);
  await page.route('**/api/staff-requests/team', route => route.fulfill({ json: { success: true, data: {
    own_staff: [member],
    staff: Array.from({ length: 12 }, (_, index) => ({
      ...member, id: index + 10, staff_id: `REPORT-${index}`, name: `Team Nurse ${index}`,
      designation: 'Charge Nurse', department: 'Critical Care',
    })),
  } } }));
  await page.getByRole('button', { name: /^My Team/ }).click();
  const reports = page.getByRole('table', { name: 'Direct reports', exact: true });
  await expect(reports.getByRole('columnheader')).toHaveText(['Staff ID', 'Name & Professional Title', 'Department', 'Contact']);
  await expect(reports.getByRole('row')).toHaveCount(11);
  await page.getByRole('button', { name: 'Next staff members page', exact: true }).click();
  await expect(reports.getByRole('row')).toHaveCount(3);
  await page.getByRole('textbox', { name: 'Search direct reports' }).fill('Team Nurse 0');
  await expect(reports.getByRole('row')).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const requestTable = page.getByRole('table', { name: 'Staff requests', exact: true });
  expect(await requestTable.evaluate(table => table.parentElement!.scrollWidth > table.parentElement!.clientWidth)).toBe(true);
  expect(await requestTable.getByRole('columnheader', { name: 'Decision', exact: true }).evaluate(cell => getComputedStyle(cell).position)).not.toBe('sticky');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('my-team-mobile.png'), fullPage: true });
});
