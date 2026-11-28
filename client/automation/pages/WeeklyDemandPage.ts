import { type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';
import { DAYS, SHIFTS, type Day, type Shift } from '../test-data/rostering';

export interface DemandRow {
  shift: Shift;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface DemandPayload {
  effective_from: string;
  demand_matrix: DemandRow[];
}

export interface SaveDemandResult {
  payload: DemandPayload;
  response: Response;
}

/** "Weekly Demand Matrix" editor opened from a pool's Edit Demand / Edit Config buttons. */
export class WeeklyDemandPage extends BasePage {
  readonly heading: Locator;
  readonly breadcrumbCurrent: Locator;
  readonly backToPoolButton: Locator;
  readonly saveDemandBaselineButton: Locator;
  readonly demandInputs: Locator;
  readonly weeklyManHoursPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Weekly Demand Matrix', level: 1 });
    this.breadcrumbCurrent = page.getByRole('navigation').getByText('Weekly Demand Matrix');
    this.backToPoolButton = page.getByRole('button', { name: 'Back to Pool' });
    this.saveDemandBaselineButton = page.getByRole('button', { name: 'Save Demand Baseline' });
    // Inputs have no labels; they render row by row (Day, Early, Late, Night) x (Mon..Sun).
    this.demandInputs = page.getByRole('spinbutton');
    this.weeklyManHoursPanel = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Weekly Man-Hours' }) })
      .filter({ hasText: /hrs/i })
      .last();
  }

  demandInput(shift: Shift, day: Day): Locator {
    return this.demandInputs.nth(SHIFTS.indexOf(shift) * DAYS.length + DAYS.indexOf(day));
  }

  /**
   * The editor first renders placeholder data (3 rows) and only then swaps in the pool's
   * real 4x7 demand. Wait for the Night row so reads/edits never hit the placeholder grid.
   */
  async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
    await this.page.getByRole('cell', { name: 'Night Baseline' }).waitFor();
    await this.demandInputs.nth(SHIFTS.length * DAYS.length - 1).waitFor();
  }

  /** 4x7 matrix of the current editor values. */
  async readDemandMatrix(): Promise<number[][]> {
    await this.waitForLoaded();
    const values = await this.demandInputs.evaluateAll((inputs) => inputs.map((i) => (i as HTMLInputElement).value));
    return SHIFTS.map((_, row) => values.slice(row * 7, row * 7 + 7).map(Number));
  }

  async readWeeklyManHours(): Promise<string> {
    await this.waitForLoaded();
    const text = await this.weeklyManHoursPanel.innerText();
    const match = text.match(/(-?[\w.]+)\s*hrs/i);
    if (!match) throw new Error(`Weekly Man-Hours value not found in: ${text}`);
    return match[1];
  }

  /** Clears the cell completely before typing so the controlled input never keeps stale digits. */
  async setDemand(shift: Shift, day: Day, value: number | string): Promise<void> {
    await this.waitForLoaded();
    const input = this.demandInput(shift, day);
    await input.click();
    await input.fill('');
    await input.pressSequentially(String(value));
    await input.blur();
  }

  /** Raw fill, used for invalid-input checks where the browser/app may coerce the value. */
  async fillDemandRaw(shift: Shift, day: Day, value: string): Promise<void> {
    await this.waitForLoaded();
    await this.demandInput(shift, day).fill(value);
  }

  /** Applies a full 4x7 matrix, touching only cells that differ. */
  async setDemandMatrix(matrix: number[][]): Promise<void> {
    const current = await this.readDemandMatrix();
    for (const [row, shift] of SHIFTS.entries()) {
      for (const [col, day] of DAYS.entries()) {
        if (current[row][col] !== matrix[row][col]) await this.setDemand(shift, day, matrix[row][col]);
      }
    }
  }

  /** Clicks Save and returns the PUT payload sent to /api/pools/:id/demand. */
  async saveDemandBaseline(): Promise<SaveDemandResult> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.request().method() === 'PUT' && /\/api\/pools\/[^/]+\/demand$/.test(r.url()),
    );
    await this.saveDemandBaselineButton.click();
    const response = await responsePromise;
    return { payload: response.request().postDataJSON() as DemandPayload, response };
  }

  async backToPool(): Promise<void> {
    await this.backToPoolButton.click();
  }
}
