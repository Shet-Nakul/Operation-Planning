import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { DAYS, SHIFTS, type Day, type Shift } from '../test-data/rostering';
import { weekDatesFromRange } from '../utils/week';

export interface ScheduleCell {
  shift: Shift;
  day: Day;
  /** null when the cell shows "— No data". */
  assigned: number | null;
  required: number | null;
  status: string;
}

export interface AssignedStaff {
  name: string;
  staffId: string;
}

/** Pool details page: Schedule Output grid, Demand Baseline, shift drawer and summary panels. */
export class PoolDetailsPage extends BasePage {
  readonly resourcePoolsBreadcrumb: Locator;
  readonly editDemandButton: Locator;
  readonly editConfigButton: Locator;
  readonly currentWeekPlanningHeading: Locator;
  readonly weekRangeLabel: Locator;
  readonly previousWeekButton: Locator;
  readonly nextWeekButton: Locator;
  readonly scheduleTable: Locator;
  readonly demandBaselineTable: Locator;
  readonly generatingRosterMessage: Locator;
  readonly generatingRosterDetail: Locator;
  readonly errorMessage: Locator;
  readonly weeklyCapacityPanel: Locator;
  readonly alertsPanel: Locator;
  readonly shiftDrawerHeading: Locator;
  readonly shiftDrawer: Locator;
  readonly shiftDrawerStaffButtons: Locator;
  readonly shiftDrawerEmptyMessage: Locator;
  readonly shiftDrawerCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.resourcePoolsBreadcrumb = page.getByRole('navigation').getByRole('button', { name: 'Resource Pools' });
    this.editDemandButton = page.getByRole('button', { name: 'Edit Demand' });
    this.editConfigButton = page.getByRole('button', { name: 'Edit Config' });
    this.currentWeekPlanningHeading = page.getByRole('heading', { name: 'Current Week Planning' });
    this.weekRangeLabel = page.getByText(/^[A-Z][a-z]{2} \d{2} - [A-Z][a-z]{2} \d{2}, \d{4}$/);

    // The week arrows are icon-only buttons; scope them to the "Current Week Planning" header block.
    const weekHeader = page
      .locator('div')
      .filter({ has: this.currentWeekPlanningHeading })
      .filter({ has: page.getByRole('button') })
      .last();
    this.previousWeekButton = weekHeader.getByRole('button').first();
    this.nextWeekButton = weekHeader.getByRole('button').last();

    this.scheduleTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Shift Type' }) });
    this.demandBaselineTable = page
      .getByRole('table')
      .filter({ has: page.getByRole('columnheader', { name: 'Shift', exact: true }) });
    this.generatingRosterMessage = page.getByText('Generating this week’s roster…');
    this.generatingRosterDetail = page.getByText(/Applying the updated weekly demand/);
    this.errorMessage = page.getByRole('main').getByText(/failed to|something went wrong/i);
    this.weeklyCapacityPanel = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Weekly Capacity' }) })
      .last();
    this.alertsPanel = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Alerts', exact: true }) }).last();

    this.shiftDrawerHeading = page.getByRole('heading', { level: 3, name: /^(Day|Early|Late|Night) — \d{4}-\d{2}-\d{2}$/ });
    this.shiftDrawerCloseButton = page.getByRole('button', { name: 'Close', exact: true });
    this.shiftDrawer = page
      .locator('div')
      .filter({ has: this.shiftDrawerHeading })
      .filter({ has: this.shiftDrawerCloseButton })
      .last();
    this.shiftDrawerStaffButtons = this.shiftDrawer.getByRole('button', { name: /STAFF-\S+ View$/ });
    this.shiftDrawerEmptyMessage = this.shiftDrawer.getByText('No staff assigned.');
  }

  poolHeading(poolName: string): Locator {
    return this.page.getByRole('heading', { name: poolName, level: 1 });
  }

  // ---------- Schedule Output ----------

  scheduleCell(shift: Shift, day: Day): Locator {
    return this.scheduleTable
      .getByRole('row')
      .nth(SHIFTS.indexOf(shift) + 1)
      .getByRole('cell')
      .nth(DAYS.indexOf(day) + 1);
  }

  async readScheduleCell(shift: Shift, day: Day): Promise<ScheduleCell> {
    const text = (await this.scheduleCell(shift, day).innerText()).trim();
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    const status = text.replace(/\d+\s*\/\s*\d+|—/g, '').trim().toLowerCase();
    return {
      shift,
      day,
      assigned: match ? Number(match[1]) : null,
      required: match ? Number(match[2]) : null,
      status,
    };
  }

  async readScheduleGrid(): Promise<ScheduleCell[]> {
    const cells: ScheduleCell[] = [];
    for (const shift of SHIFTS) {
      for (const day of DAYS) cells.push(await this.readScheduleCell(shift, day));
    }
    return cells;
  }

  async readWeekRange(): Promise<string> {
    return (await this.weekRangeLabel.innerText()).trim();
  }

  /** ISO dates (Mon..Sun) of the week currently shown in the Schedule Output grid. */
  async currentWeekDates(): Promise<string[]> {
    return weekDatesFromRange(await this.readWeekRange());
  }

  async goToNextWeek(): Promise<void> {
    const before = await this.readWeekRange();
    await this.nextWeekButton.click();
    await this.weekRangeLabel.filter({ hasNotText: before }).waitFor();
  }

  async goToPreviousWeek(): Promise<void> {
    const before = await this.readWeekRange();
    await this.previousWeekButton.click();
    await this.weekRangeLabel.filter({ hasNotText: before }).waitFor();
  }

  // ---------- Demand Baseline / summary ----------

  /** Demand Baseline as a 4x7 matrix (rows Day/Early/Late/Night, columns Mon..Sun). */
  async readDemandBaseline(): Promise<number[][]> {
    const matrix: number[][] = [];
    for (let row = 1; row <= SHIFTS.length; row++) {
      const cells = this.demandBaselineTable.getByRole('row').nth(row).getByRole('cell');
      const values = await cells.allInnerTexts();
      matrix.push(values.slice(1, 8).map((v) => Number(v.trim())));
    }
    return matrix;
  }

  async readWeeklyCapacityHours(): Promise<number> {
    const text = await this.weeklyCapacityPanel.innerText();
    const match = text.match(/(\d+)\s*Hours/i);
    if (!match) throw new Error(`Weekly Capacity value not found in: ${text}`);
    return Number(match[1]);
  }

  async openDemandEditor(): Promise<void> {
    await this.editDemandButton.click();
  }

  async openDemandEditorViaConfig(): Promise<void> {
    await this.editConfigButton.click();
  }

  /**
   * Waits for the post-save solver run: the "Generating…" placeholder may appear briefly
   * or for about a minute, then the Schedule Output grid is re-rendered.
   */
  async waitForRosteringToComplete(timeout: number): Promise<void> {
    await this.generatingRosterMessage.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
    await this.waitForRosteringIdle(timeout);
  }

  /** Returns once no solver run is in progress (does not wait for one to start). */
  async waitForRosteringIdle(timeout: number): Promise<void> {
    await this.generatingRosterMessage.waitFor({ state: 'hidden', timeout });
    await this.scheduleTable.waitFor();
  }

  // ---------- Shift drawer ----------

  async openShift(shift: Shift, day: Day): Promise<void> {
    await this.scheduleCell(shift, day).click();
    await this.shiftDrawerHeading.waitFor();
  }

  async readShiftDrawerHeading(): Promise<string> {
    return (await this.shiftDrawerHeading.innerText()).trim();
  }

  async readAssignedStaff(): Promise<AssignedStaff[]> {
    const rows = await this.shiftDrawerStaffButtons.allInnerTexts();
    return rows.map((row) => {
      const lines = row.split('\n').map((l) => l.trim()).filter(Boolean);
      const staffId = lines.find((l) => /^STAFF-/.test(l)) ?? '';
      return { name: lines[0], staffId };
    });
  }

  async closeShiftDrawer(): Promise<void> {
    await this.shiftDrawerCloseButton.click();
    await this.shiftDrawerHeading.waitFor({ state: 'hidden' });
  }

  /** Opens the staff profile from the drawer row of the given staff ID. */
  async viewAssignedStaff(staffId: string): Promise<void> {
    await this.shiftDrawer.getByRole('button', { name: new RegExp(`${staffId} View$`) }).click();
  }

  /**
   * Scans the displayed week's drawers and returns the first shift/day the staff member
   * is assigned to (drawer left open), or null when they are not rostered this week.
   */
  async findShiftOf(staffId: string): Promise<{ shift: Shift; day: Day } | null> {
    for (const cell of await this.readScheduleGrid()) {
      if (!cell.assigned) continue;
      await this.openShift(cell.shift, cell.day);
      if ((await this.readAssignedStaff()).some((s) => s.staffId === staffId)) return { shift: cell.shift, day: cell.day };
      await this.closeShiftDrawer();
    }
    return null;
  }
}
