import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { monthLabel } from '../utils/week';

export interface CalendarAssignment {
  date: string;
  letter: string;
  shift: string;
  /** Pool ID, or "-" for days off. */
  poolId: string;
  /** "08:00 - 16:00", or "-" for days off. */
  time: string;
  /** Any rendered lines beyond a single assignment (should always be empty). */
  extra: string[];
}

function parseCalendarDay(date: string, text: string): CalendarAssignment {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // Rendered as: <day-of-month>, <letter>, <shift name>, <pool id | ->, <time | ->
  const [, letter = '', shift = '', poolId = '', time = '', ...extra] = lines;
  return { date, letter, shift, poolId, time, extra };
}

/** Individual staff profile, including the Employee Calendar of rostering results. */
export class StaffProfilePage extends BasePage {
  readonly breadcrumbIndividuals: Locator;
  readonly nameHeading: Locator;
  readonly employeeId: Locator;
  readonly poolsPanel: Locator;
  readonly employeeCalendar: Locator;
  readonly calendarMonthLabel: Locator;
  readonly previousMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly calendarDays: Locator;
  readonly selectedDayButton: Locator;
  readonly selectedDayShift: Locator;
  readonly selectedDayPool: Locator;
  readonly selectedDayTime: Locator;

  constructor(page: Page) {
    super(page);
    this.breadcrumbIndividuals = page.getByRole('navigation').getByText('Individuals');
    this.nameHeading = page.getByRole('main').getByRole('heading', { level: 2 }).first();
    this.employeeId = page.getByText(/^#STAFF-/);
    this.poolsPanel = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Pools', exact: true, level: 4 }) }).last();
    this.employeeCalendar = page.getByRole('region', { name: 'Employee Calendar' });
    this.calendarMonthLabel = this.employeeCalendar.getByText(/^[A-Z][a-z]+ \d{4}$/);
    this.previousMonthButton = page.getByRole('button', { name: 'Previous calendar month' });
    this.nextMonthButton = page.getByRole('button', { name: 'Next calendar month' });
    this.calendarDays = this.employeeCalendar.getByRole('button', { name: /^Assignments for \d{4}-\d{2}-\d{2}$/ });
    this.selectedDayButton = this.employeeCalendar.getByRole('button', { pressed: true });
    this.selectedDayShift = this.employeeCalendar.getByText(/^Shift: /);
    this.selectedDayPool = this.employeeCalendar.getByText(/^Pool: /);
    this.selectedDayTime = this.employeeCalendar.getByText(/^Time: /);
  }

  calendarDay(isoDate: string): Locator {
    return this.employeeCalendar.getByRole('button', { name: `Assignments for ${isoDate}`, exact: true });
  }

  async waitForLoaded(): Promise<void> {
    await this.employeeCalendar.waitFor();
    await this.calendarDays.first().waitFor();
  }

  /** Navigates the calendar month-by-month until the month containing `isoDate` is shown. */
  async showMonthOf(isoDate: string): Promise<void> {
    const target = monthLabel(isoDate);
    for (let i = 0; i < 24; i++) {
      const current = (await this.calendarMonthLabel.innerText()).trim();
      if (current === target) return;
      const goForward = new Date(`1 ${target}`) > new Date(`1 ${current}`);
      await (goForward ? this.nextMonthButton : this.previousMonthButton).click();
      await this.calendarMonthLabel.filter({ hasNotText: current }).waitFor();
    }
    throw new Error(`Could not navigate Employee Calendar to ${target}`);
  }

  async readAssignment(isoDate: string): Promise<CalendarAssignment> {
    await this.showMonthOf(isoDate);
    return parseCalendarDay(isoDate, await this.calendarDay(isoDate).innerText());
  }

  /** All assignments of the month currently displayed. */
  async readDisplayedMonth(): Promise<CalendarAssignment[]> {
    const result: CalendarAssignment[] = [];
    for (const day of await this.calendarDays.all()) {
      const date = ((await day.getAttribute('aria-label')) ?? '').replace('Assignments for ', '').trim();
      result.push(parseCalendarDay(date, await day.innerText()));
    }
    return result;
  }

  async selectDay(isoDate: string): Promise<void> {
    await this.showMonthOf(isoDate);
    await this.calendarDay(isoDate).click();
  }
}
