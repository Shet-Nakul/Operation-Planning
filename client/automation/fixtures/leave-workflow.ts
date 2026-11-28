import { type Page, type Response, test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StaffPortalPage } from '../pages/StaffPortalPage';
import { LeaveRequestPage } from '../pages/LeaveRequestPage';
import { MyRequestsPage } from '../pages/MyRequestsPage';
import { SupervisorTeamPage } from '../pages/SupervisorTeamPage';
import { credentials, leaveData } from '../test-data/leave';

export type LeaveRequest = {
  id: number;
  staff_id: string;
  staff_name: string;
  request_category: string;
  leave_type_name: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  can_review: boolean;
};

type UserPages = {
  page: Page;
  portal: StaffPortalPage;
  leave: LeaveRequestPage;
  requests: MyRequestsPage;
  team: SupervisorTeamPage;
};

type LeaveFixtures = {
  megan: UserPages;
  michael: UserPages;
};

async function signIn(page: Page, email: string, password: string): Promise<UserPages> {
  if (!password) throw new Error(`Set the leave test password for ${email} in client/automation/.env.local before running the tests`);
  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, password);
  return {
    page,
    portal: new StaffPortalPage(page),
    leave: new LeaveRequestPage(page),
    requests: new MyRequestsPage(page),
    team: new SupervisorTeamPage(page),
  };
}

export const test = base.extend<LeaveFixtures>({
  megan: async ({ page }, use) => {
    const account = credentials.megan;
    await use(await signIn(page, account.email, account.password));
  },
  michael: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    try {
      const page = await context.newPage();
      const account = credentials.michael;
      await use(await signIn(page, account.email, account.password));
    } finally {
      await context.close();
    }
  },
});

export function isRequestsResponse(response: Response, method: string): boolean {
  return new URL(response.url()).pathname === '/api/staff-requests' && response.request().method() === method;
}

export async function submitLeave(user: UserPages, data: ReturnType<typeof leaveData>): Promise<Response> {
  await user.leave.fill(data.start, data.end, data.reason);
  const response = user.page.waitForResponse(result => isRequestsResponse(result, 'POST'));
  await user.leave.submit();
  return response;
}
