import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'UTC' });

test('switches between lifecycle tabs and only completes a surgery after confirmation', async ({ page }) => {
  const now = new Date('2026-11-20T12:00:00Z');
  await page.clock.install({ time: now });
  await page.addInitScript(() => {
    localStorage.setItem('op.accessToken', 'fixture-token');
    localStorage.setItem('op.user', JSON.stringify({
      id: 1, first_name: 'Test', email: 'admin@example.test', role: 'ADMIN', organization_id: 1,
    }));
  });

  const surgery = (id: number, name: string, status: string, plannedStart: string) => ({
    id, name, status, surgery_id: `TEST-${id}`, organization_id: 1, type: 'elective',
    infection_type: 0, stages: null,
    time_windows: {
      operation_type: 'Test procedure',
      earliest_date: '2026-11-01T00:00',
      latest_date: '2026-12-01T23:59',
      planned_start: plannedStart,
    },
  });
  const upcoming = surgery(1, 'Upcoming case', 'PLANNED', '2026-11-20T12:01:00Z');
  const elapsed = surgery(2, 'Elapsed case', 'PLANNED', '2026-11-19T10:00:00Z');
  const done = {
    ...surgery(3, 'Confirmed case', 'DONE', '2026-11-19T10:00:00Z'),
    updated_at: '2026-11-19T22:15:00Z',
  };
  const deadline = surgery(4, 'Deadline case', 'PLANNED', '');
  deadline.time_windows.latest_date = '2026-11-20T12:01';
  const pending = surgery(5, 'Pending case', 'ESTIMATED', '');
  const cancelled = surgery(6, 'Cancelled case', 'CANCELLED', '');
  const draft = surgery(7, 'Saved draft', 'DRAFT', '');
  const writes: string[] = [];
  let planningRuns = 0;

  await page.route(/\/(?:api|auth)\//, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const headers = {
      'access-control-allow-origin': request.headers().origin ?? '*',
      'access-control-allow-headers': 'authorization, content-type',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (pathname === '/api/planning') {
      if (++planningRuns === 2) {
        pending.status = 'PLANNED';
        pending.time_windows.planned_start = '2026-11-25T10:00:00Z';
      }
      await route.fulfill({ headers, json: { success: true, processId: 'test-planning-run' } });
      return;
    }
    if (pathname === '/api/planning-state') {
      await route.fulfill({ headers, json: { success: true, data: { running: false } } });
      return;
    }
    if (pathname === '/api/surgeries/5' && request.method() === 'PUT') {
      pending.status = request.postDataJSON().status;
      await route.fulfill({ headers, json: { success: true, data: pending } });
      return;
    }
    if (pathname === '/api/surgeries/2' || pathname === '/api/surgeries/7') {
      const record = pathname.endsWith('/2') ? elapsed : draft;
      const { status } = request.postDataJSON();
      writes.push(`${request.method()} ${pathname} ${status}`);
      record.status = status;
      await route.fulfill({ headers, json: { success: true, data: record } });
      return;
    }
    const data = pathname === '/api/surgeries' ? [upcoming, elapsed, done, deadline, pending, cancelled, draft]
      : pathname === '/api/organizations/1' ? { name: 'Test Hospital' }
        : pathname === '/api/surgery-plans' ? [{
          surgery_id: upcoming.surgery_id,
          result: { resources_assigned: { Surgeon: 'Dr. Morgan', 'Operating Room': 'Test OR' } },
        }] : [];
    await route.fulfill({ headers, json: { success: true, data } });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Surgery Requests', exact: true }).click();
  const tab = (name: string) => page.getByRole('tab', { name, exact: true });
  const row = (name: string) => page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(name) }) });
  await expect(tab('Planned')).toHaveAttribute('aria-selected', 'true');
  const plannedTable = page.getByRole('table', { name: 'Planned surgery requests' });
  await expect(plannedTable.getByRole('columnheader', { name: 'Surgeon in charge', exact: true })).toBeVisible();
  await expect(plannedTable.getByRole('columnheader', { name: 'Care team & room' })).toHaveCount(0);
  await expect(row('Upcoming case')).toContainText('Planned start');
  await expect(row('Upcoming case').getByRole('cell', { name: 'Dr. Morgan', exact: true })).toBeVisible();
  await expect(row('Upcoming case')).not.toContainText('Test OR');
  await tab('Planned').press('ArrowLeft');
  await expect(tab('Planning')).toBeFocused();
  await expect(row('Pending case')).toBeVisible();
  await expect(row('Upcoming case')).toHaveCount(0);

  const submitPendingCase = async () => {
    await row('Pending case').getByRole('button', { name: 'Edit request' }).click();
    await page.getByRole('button', { name: 'Continue to Step 2' }).click();
    await page.getByRole('button', { name: 'Next: Scheduling' }).click();
    await page.getByRole('button', { name: 'Review & Confirm' }).click();
    await page.getByRole('button', { name: 'Review Resource Flags' }).click();
    await page.getByRole('button', { name: 'Submit Surgery Request' }).click();
  };
  await submitPendingCase();
  await expect(page.getByText('No schedule was confirmed for this request.', { exact: false })).toBeVisible();
  await expect(row('Pending case')).toBeVisible();

  await submitPendingCase();
  await expect(page.getByText('Surgery scheduled.', { exact: true })).toBeVisible();
  await expect(tab('Planning')).toHaveAttribute('aria-selected', 'true');
  await expect(row('Pending case')).toHaveCount(0);
  await tab('Planned').click();
  await row('Pending case').getByRole('button', { name: 'View plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Surgery plan', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to list', exact: true }).click();

  await tab('Completed').click();
  await expect(page.getByRole('columnheader', { name: 'Completion recorded' })).toBeVisible();
  await expect(row('Confirmed case').locator('time')).toHaveAttribute('datetime', '2026-11-19T22:15:00.000Z');
  await expect(row('Confirmed case')).not.toContainText('Expected end');
  await expect(row('Elapsed case')).toHaveCount(0);
  await tab('Awaiting completion').click();
  await expect(row('Elapsed case')).toBeVisible();
  await expect(row('Deadline case')).toHaveCount(0);
  await page.clock.fastForward(75_000);
  await expect(row('Deadline case')).toBeVisible();
  expect(writes).toEqual([]);

  await tab('In progress').click();
  await expect(row('Upcoming case')).toBeVisible();
  await tab('Awaiting completion').click();
  await row('Elapsed case').getByRole('button', { name: 'Review completion', exact: true }).click();
  await expect(page.getByText('The time window has ended, but completion has not been recorded.', { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Confirm completion', exact: true }).click();
  expect(writes).toEqual([]);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Confirm completion', exact: true }).click();
  await expect(tab('Completed')).toHaveAttribute('aria-selected', 'true');
  await expect(row('Elapsed case')).toContainText('Not recorded');
  expect(writes).toEqual(['PUT /api/surgeries/2 DONE']);

  await tab('Drafts').click();
  await row('Saved draft').getByRole('button', { name: 'Edit request', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel Request', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel Request', exact: true }).last().click();
  await expect(tab('Drafts')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('Cancelled')).toHaveCount(0);
  await expect(row('Cancelled case')).toHaveCount(0);
  await expect(row('Saved draft')).toHaveCount(0);
  expect(writes).toEqual(['PUT /api/surgeries/2 DONE', 'PUT /api/surgeries/7 CANCELLED']);

  await tab('Completed').click();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(tab('Awaiting completion')).toBeInViewport();
    await expect.poll(() => tab('Awaiting completion').evaluate((button) => {
      const [label, badge] = Array.from(button.querySelectorAll('span'), (part) => part.getBoundingClientRect());
      return badge.left >= label.right && Math.abs((badge.top + badge.bottom) - (label.top + label.bottom)) < 2;
    })).toBe(true);
    await expect(row('Confirmed case')).toBeInViewport();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const tabsFillWidth = await page.getByRole('tablist', { name: 'Surgery stages' }).evaluate((list) => {
      const bounds = list.getBoundingClientRect();
      const tabs = Array.from(list.children, (tab) => tab.getBoundingClientRect());
      const firstRow = tabs.filter((tab) => tab.top === tabs[0].top);
      return Math.abs(firstRow[0].left - bounds.left) < 1
        && Math.abs(firstRow[firstRow.length - 1].right - bounds.right) < 1;
    });
    expect(tabsFillWidth).toBe(true);
  }
  const scrollArea = page.getByRole('region', { name: 'Completed table scroll area' });
  expect(await scrollArea.evaluate((area) => area.scrollWidth > area.clientWidth)).toBe(true);
});
