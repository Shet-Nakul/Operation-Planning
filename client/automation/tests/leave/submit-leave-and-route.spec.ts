// spec: specs/leave-supervisor-review.plan.md
import { expect } from '@playwright/test';
import { isRequestsResponse, submitLeave, test, type LeaveRequest } from '../../fixtures/leave-workflow';
import { leaveData, leaveTestData } from '../../test-data/leave';

test.describe('Leave request and supervisor review', () => {
  test.skip(process.env[leaveTestData.mutationOptInVariable] !== '1', 'Requires an isolated, disposable environment and explicit mutation opt-in.');

  test('Submit leave and route to the immediate supervisor', async ({ megan, michael }) => {
    const data = leaveData(10);
    await michael.portal.openMyTeam();
    await expect(michael.team.heading).toBeVisible();
    await expect(michael.team.pendingCount).toHaveText(/^\d+$/);
    const supervisorPending = Number(await michael.team.pendingCount.textContent());

    const initialResponse = megan.page.waitForResponse(response => isRequestsResponse(response, 'GET'));
    await megan.portal.openRequestCenter();
    const initial = await initialResponse;
    expect(initial.ok()).toBeTruthy();
    const { data: requests } = await initial.json() as { data: LeaveRequest[] };
    const ownRequests = requests.filter(request => request.staff_id === leaveTestData.megan.staffId);
    expect(ownRequests.filter(request => request.reason === data.reason)).toHaveLength(0);
    expect(ownRequests.filter(request => request.status !== 'REJECTED' && request.start_date <= data.end && request.end_date >= data.start)).toHaveLength(0);
    const personalPending = ownRequests.filter(request => request.status === 'PENDING').length;
    const leavePending = ownRequests.filter(request => request.request_category === 'LEAVE' && request.status === 'PENDING').length;

    await megan.leave.open();
    await expect(megan.leave.heading).toBeVisible();
    await expect(megan.leave.category).toBeVisible();
    await megan.leave.selectVacation();
    await expect(megan.leave.requestType).toHaveText('Vacation');
    await expect(megan.leave.pendingLeaveCount).toHaveText(`${leavePending} leave requests pending`);

    const createdResponse = await submitLeave(megan, data);
    expect(createdResponse.status()).toBe(201);
    const { data: created } = await createdResponse.json() as { data: LeaveRequest };
    expect(created.id).toEqual(expect.any(Number));
    expect(created).toMatchObject({
      staff_id: leaveTestData.megan.staffId, staff_name: leaveTestData.megan.name, request_category: 'LEAVE',
      leave_type_name: 'Vacation', start_date: data.start, end_date: data.end,
      reason: data.reason, status: 'PENDING',
    });

    await megan.portal.openMyRequests();
    await expect(megan.requests.heading).toBeVisible();
    await megan.requests.filterLeaves();
    let personalRow = megan.requests.requestRow(data.reason);
    await expect(personalRow).toHaveCount(1);
    await expect(personalRow).toContainText('Awaiting supervisor');
    await expect(personalRow).toContainText(data.start);
    await expect(personalRow).toContainText(data.end);
    await expect(personalRow).toContainText('Vacation');
    await expect(personalRow).toContainText('Awaiting reviewer');
    await expect(personalRow.getByRole('button', { name: /accept|approve/i })).toHaveCount(0);
    await expect(megan.requests.pendingCount).toHaveText(String(personalPending + 1).padStart(2, '0'));

    const reloadedRequests = megan.page.waitForResponse(response => isRequestsResponse(response, 'GET'));
    await megan.page.reload();
    const persistedResponse = await reloadedRequests;
    expect(persistedResponse.ok()).toBeTruthy();
    const { data: persisted } = await persistedResponse.json() as { data: LeaveRequest[] };
    expect(persisted.filter(request => request.reason === data.reason)).toEqual([
      expect.objectContaining({ id: created.id, status: 'PENDING' }),
    ]);
    await megan.portal.openMyRequests();
    await megan.requests.filterLeaves();
    personalRow = megan.requests.requestRow(data.reason);
    await expect(personalRow).toHaveCount(1);
    await expect(personalRow).toContainText('Awaiting supervisor');
    await megan.portal.openRequestCenter();
    await megan.leave.open();
    await expect(megan.leave.pendingLeaveCount).toHaveText(`${leavePending + 1} leave requests pending`);

    await michael.team.refresh();
    await michael.team.searchRequests(data.reason);
    const supervisorRow = michael.team.requestRow(data.reason);
    await expect(supervisorRow).toHaveCount(1);
    await expect(supervisorRow).toContainText(leaveTestData.megan.name);
    await expect(supervisorRow).toContainText('Vacation');
    await expect(supervisorRow).toContainText(data.start);
    await expect(supervisorRow).toContainText(data.end);
    await expect(supervisorRow).toContainText('Awaiting supervisor');
    await expect(supervisorRow.getByRole('button', { name: `Approve request for ${leaveTestData.megan.name}` })).toBeVisible();
    await expect(supervisorRow.getByRole('button', { name: `Reject request for ${leaveTestData.megan.name}` })).toBeVisible();
    await expect(michael.team.pendingCount).toHaveText(String(supervisorPending + 1));
  });
});
