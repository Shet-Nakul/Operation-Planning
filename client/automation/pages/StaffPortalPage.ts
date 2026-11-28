import { type Locator, type Page } from '@playwright/test';

export class StaffPortalPage {
  readonly calendar: Locator;

  constructor(private readonly page: Page) {
    this.calendar = page.getByRole('region', { name: 'Employee Calendar' });
  }

  async openHome(): Promise<void> {
    await this.page.getByRole('button', { name: 'Home', exact: true }).click();
  }

  async openRequestCenter(): Promise<void> {
    await this.page.getByRole('button', { name: 'Request Center', exact: true }).click();
  }

  async openMyRequests(): Promise<void> {
    await this.page.getByRole('button', { name: 'My Request', exact: true }).click();
  }

  async openMyTeam(): Promise<void> {
    await this.page.getByRole('button', { name: 'My Team', exact: true }).click();
  }

  async nextCalendarMonth(): Promise<void> {
    await this.calendar.getByRole('button', { name: 'Next calendar month' }).click();
  }

  calendarDay(date: string): Locator {
    return this.calendar.getByRole('button', { name: `Assignments for ${date}` });
  }
}
