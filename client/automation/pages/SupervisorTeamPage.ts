import { type Locator, type Page } from '@playwright/test';

export class SupervisorTeamPage {
  readonly heading: Locator;
  readonly pendingCount: Locator;
  readonly decisionSaved: Locator;
  private readonly requests: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Team', exact: true });
    this.requests = page.getByRole('table', { name: 'Staff requests' });
    this.pendingCount = page.getByText('Awaiting Your Approval', { exact: true }).locator('..').locator('p').last();
    this.decisionSaved = page.getByRole('status').filter({ hasText: 'Request decision saved.' });
  }

  async searchRequests(query: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Search staff requests' }).fill(query);
  }

  async filterStatus(status: 'PENDING' | 'APPROVED' | 'ALL'): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Request status' }).selectOption(status);
  }

  async refresh(): Promise<void> {
    await this.page.getByRole('button', { name: 'Refresh team and requests' }).click();
  }

  requestRow(reason: string): Locator {
    return this.requests.getByRole('row').filter({ hasText: reason });
  }

  async approve(reason: string, staffName: string): Promise<void> {
    await this.requestRow(reason).getByRole('button', { name: `Approve request for ${staffName}` }).click();
  }
}
