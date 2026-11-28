import { type Locator, type Page } from '@playwright/test';

export class LeaveRequestPage {
  readonly heading: Locator;
  readonly category: Locator;
  readonly requestType: Locator;
  readonly approvedDays: Locator;
  readonly pendingLeaveCount: Locator;
  readonly recentActivity: Locator;
  private readonly startDate: Locator;
  private readonly endDate: Locator;
  private readonly notes: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Leave Requests' });
    this.category = page.getByRole('button', { name: 'Leave (Time-Off)' });
    this.requestType = page.getByText('Request Type', { exact: true }).locator('..').getByRole('button').first();
    this.startDate = page.locator('input[type="date"]').nth(0);
    this.endDate = page.locator('input[type="date"]').nth(1);
    this.notes = page.getByPlaceholder('Briefly describe the reason for leave', { exact: false });
    this.submitButton = page.getByRole('button', { name: 'Submit Request' });
    this.approvedDays = page.getByText('days approved', { exact: true }).locator('..').locator('span').first();
    this.pendingLeaveCount = page.getByText(/^\d+ leave requests pending$/);
    this.recentActivity = page.getByRole('heading', { name: 'Recent Activity' }).locator('..');
  }

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Leave', exact: true }).click();
  }

  async selectVacation(): Promise<void> {
    if ((await this.requestType.textContent())?.trim() === 'Vacation') return;
    await this.requestType.click();
    await this.page.getByRole('button', { name: 'Vacation', exact: true }).last().click();
  }

  async fill(start: string, end: string, reason: string): Promise<void> {
    await this.startDate.fill(start);
    await this.endDate.fill(end);
    await this.notes.fill(reason);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
