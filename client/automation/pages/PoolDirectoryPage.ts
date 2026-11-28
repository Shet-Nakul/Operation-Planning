import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PoolDirectoryPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Pool Directory', level: 1 });
  }

  /** The card container holding both the pool title and its "View Details" button. */
  poolCard(poolName: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByRole('heading', { name: poolName, exact: true, level: 3 }) })
      .filter({ has: this.page.getByRole('button', { name: 'View Details' }) })
      .last();
  }

  async openPool(poolName: string): Promise<void> {
    await this.poolCard(poolName).getByRole('button', { name: 'View Details' }).click();
  }
}
