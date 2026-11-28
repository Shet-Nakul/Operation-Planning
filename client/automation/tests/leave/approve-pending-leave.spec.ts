// spec: specs/leave-supervisor-review.plan.md
import { expect } from '@playwright/test';
import { isRequestsResponse, submitLeave, test, type LeaveRequest } from '../../fixtures/leave-workflow';
import { leaveData, leaveTestData } from '../../test-data/leave';

test.describe('Leave request and supervisor review', () => {
  test.skip(process.env[leaveTestData.mutationOptInVariable] !== '1', 'Requires an isolated, disposable environment and explicit mutation opt-in.');

  test('Approve a pending leave request', async ({ megan, michael }) => {
    const data = leaveData(20);

    await megan.portal.nextCalendarMonth();
    await expect(megan.portal.calendarDay(data.start)).toBeVisible();
    const originalStart = await megan.portal.calendarDay(data.start).innerText();
    const originalEnd = await megan.portal.calendarDay(data.end).innerText();
    expect(originalStart).not.toContain('Leave');
    expect(originalEnd).not.toContain('Leave');

    const initialResponse = megan.page.waitForResponse(response => isRequestsResponse(response, 'GET'));
    await megan.portal.openRequestCenter();
    const initial = await initialResponse;
    expect(initial.ok()).toBeTruthy();
    const { data: requests } = await initial.json() as { data: LeaveRequest[] };
    const ownRequests = requests.filter(request => request.staff_id === leaveTestData.megan.staffId);
    expect(ownRequests.filter(request => request.reason === data.reason)).toHaveLength(0);
    expect(ownRequests.filter(request => request.status !== 'REJECTED' && request.start_date <= data.end && request.end_date >= data.start)).toHaveLength(0);

    await megan.leave.open();
    await expect(megan.leave.heading).toBeVisible();
    await megan.leave.selectVacation();
    await expect(megan.leave.approvedDays).toHaveText(/^\d+$/);
    const approvedDays = Number(await megan.leave.approvedDays.textContent());
    const createdResponse = await submitLeave(megan, data);
    expect(createdResponse.status()).toBe(201);
    const { data: created } = await createdResponse.json() as { data: LeaveRequest };
    expect(created).toMatchObject({
      id: expect.any(Number), staff_id: leaveTestData.megan.staffId, leave_type_name: 'Vacation',
      start_date: data.start, end_date: data.end, reason: data.reason, status: 'PENDING',
    });

    await michael.portal.openMyTeam();
    await expect(michael.team.heading).toBeVisible();
    await michael.team.searchRequests(data.reason);
    let supervisorRow = michael.team.requestRow(data.reason);
    await expect(supervisorRow).toHaveCount(1);
    await expect(supervisorRow).toContainText('Awaiting supervisor');
    const decisionResponse = michael.page.waitForResponse(response =>
      new URL(response.url()).pathname === `/api/staff-requests/${created.id}` && response.request().method() === 'PUT');
    await michael.team.approve(data.reason, leaveTestData.megan.name);
    const decision = await decisionResponse;
    expect(decision.ok()).toBeTruthy();
    expect((await decision.json()).data).toMatchObject({ id: created.id, status: 'APPROVED' });
    await expect(michael.team.decisionSaved).toBeVisible();
    await expect(supervisorRow).toHaveCount(0);

    await michael.team.filterStatus('APPROVED');
    supervisorRow = michael.team.requestRow(data.reason);
    await expect(supervisorRow).toHaveCount(1);
    await expect(supervisorRow).toContainText('Approved');
    await expect(supervisorRow.getByRole('button', { name: /approve|reject/i })).toHaveCount(0);
    await michael.page.reload();
    await michael.portal.openMyTeam();
    await michael.team.filterStatus('APPROVED');
    await michael.team.searchRequests(data.reason);
    await expect(michael.team.requestRow(data.reason)).toContainText('Approved');

    await megan.portal.openMyRequests();
    await megan.requests.filterLeaves();
    await expect(megan.requests.requestRow(data.reason)).toContainText('Approved');
    await megan.page.reload();
    await megan.portal.openMyRequests();
    await megan.requests.filterLeaves();
    await expect(megan.requests.requestRow(data.reason)).toContainText('Approved');

    await megan.portal.openRequestCenter();
    await megan.leave.open();
    await expect(megan.leave.approvedDays).toHaveText(String(approvedDays + 2));
    await expect(megan.leave.recentActivity).toContainText('Vacation (Approved)');
    await expect(megan.leave.recentActivity).toContainText(`${data.start} - ${data.end}`);

    await megan.portal.openHome();
    await megan.portal.nextCalendarMonth();
    await expect(megan.portal.calendarDay(data.start)).toContainText('Leave');
    await expect(megan.portal.calendarDay(data.end)).toContainText('Leave');
  });
});
