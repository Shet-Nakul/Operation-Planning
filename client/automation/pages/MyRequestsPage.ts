import { type Locator, type Page } from '@playwright/test';

export class MyRequestsPage {
  readonly heading: Locator;
  readonly pendingCount: Locator;
  private readonly table: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Request', exact: true });
    this.table = page.getByRole('table', { name: 'Personal requests' });
    this.pendingCount = page.getByText('TOTAL PENDING', { exact: true }).locator('..').locator('span');
  }

  async filterLeaves(): Promise<void> {
    await this.page.getByRole('button', { name: 'Leaves', exact: true }).click();
  }

  requestRow(reason: string): Locator {
    return this.table.getByRole('row').filter({ hasText: reason });
  }
}
