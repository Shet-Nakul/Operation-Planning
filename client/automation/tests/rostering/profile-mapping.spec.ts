// spec: specs/Rostering.md – 5. Go to the Profile and Verify the Mapping
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures/test-fixtures';
import { changeDemandAndWaitForRoster } from '../../fixtures/rostering-flows';
import { type PoolDetailsPage } from '../../pages/PoolDetailsPage';
import { type PoolDirectoryPage } from '../../pages/PoolDirectoryPage';
import {
  DAYS,
  ROSTERING_TIMEOUT_MS,
  SHIFTS,
  SHIFT_LETTERS,
  SHIFT_TIMES,
  demandChange,
  orNursingPool,
  type Shift,
} from '../../test-data/rostering';
import { monthLabel } from '../../utils/week';

/** The profile lists pools either by display name or by pool ID depending on load timing. */
const orNursingPoolPattern = new RegExp(`${orNursingPool.name}|${orNursingPool.id}`);

async function reopenOrNursingPool(directory: PoolDirectoryPage, pool: PoolDetailsPage): Promise<void> {
  await directory.goToHumanResourcePool();
  await directory.openPool(orNursingPool.name);
  await expect(pool.poolHeading(orNursingPool.name)).toBeVisible();
  await pool.waitForRosteringIdle(ROSTERING_TIMEOUT_MS);
}

/** Opens the first staffed cell of the week and then that person's profile. */
async function openFirstRosteredProfile(pool: PoolDetailsPage) {
  const weekDates = await pool.currentWeekDates();
  const cell = (await pool.readScheduleGrid()).find((c) => (c.assigned ?? 0) > 0);
  if (!cell) throw new Error('No staffed cell in the current week');
  await pool.openShift(cell.shift, cell.day);
  const [person] = await pool.readAssignedStaff();
  await pool.viewAssignedStaff(person.staffId);
  return { person, cell, weekDates, date: weekDates[DAYS.indexOf(cell.day)] };
}

test.describe('Go to the Profile and Verify the Mapping', () => {
  test.describe.configure({ timeout: 8 * 60_000 });

  test("The profile matches the drawer's day, shift, and pool", async ({
    originalDemandBaseline,
    poolDetailsPage: pool,
    weeklyDemandPage,
    staffProfilePage: profile,
  }) => {
    expect(originalDemandBaseline).toHaveLength(SHIFTS.length);
    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, demandChange);
    const date = (await pool.currentWeekDates())[DAYS.indexOf(demandChange.day)];
    await pool.openShift(demandChange.shift, demandChange.day);
    const staff = await pool.readAssignedStaff();
    expect(staff.length, 'someone is rostered on the changed shift').toBeGreaterThan(0);
    const person = staff[0];

    // 1. In the drawer, note the first person's name and Staff ID, then click View
    await pool.viewAssignedStaff(person.staffId);
    await profile.waitForLoaded();

    await expect(profile.breadcrumbIndividuals).toBeVisible();
    await expect(profile.nameHeading).toHaveText(person.name);
    await expect(profile.employeeId).toHaveText(`#${person.staffId}`);
    await expect(profile.poolsPanel).toContainText(orNursingPoolPattern);
    await expect(profile.calendarMonthLabel).toHaveText(monthLabel(date));
    await expect(profile.calendarDay(date)).toHaveAttribute('aria-pressed', 'true');

    const assignment = await profile.readAssignment(date);
    expect(assignment).toMatchObject({
      letter: SHIFT_LETTERS[demandChange.shift],
      shift: demandChange.shift,
      poolId: orNursingPool.id,
      time: SHIFT_TIMES[demandChange.shift],
    });
    await expect(profile.employeeCalendar.getByText(date, { exact: true })).toBeVisible();
    await expect(profile.selectedDayShift).toHaveText(`Shift: ${demandChange.shift} (${SHIFT_LETTERS[demandChange.shift]})`);
    await expect(profile.selectedDayPool).toHaveText(`Pool: ${orNursingPool.id}`);
    await expect(profile.selectedDayTime).toHaveText(`Time: ${SHIFT_TIMES[demandChange.shift]}`);
  });

  test('One shift per person per day', async ({ openOrNursingPool: pool, staffProfilePage: profile }) => {
    await openFirstRosteredProfile(pool);
    await profile.waitForLoaded();

    // 1. On the same profile, check every calendar day of the displayed month
    const days = await profile.readDisplayedMonth();
    expect(days.length).toBeGreaterThanOrEqual(28);
    for (const day of days) {
      expect(day.extra, `${day.date} has a single entry`).toEqual([]);
      if (day.letter === 'O') {
        expect(day, `${day.date} off`).toMatchObject({ shift: 'Off', poolId: '-', time: '-' });
        continue;
      }
      const shift = day.shift as Shift;
      expect(SHIFTS, `${day.date} shift name`).toContain(shift);
      expect(day.letter, `${day.date} letter`).toBe(SHIFT_LETTERS[shift]);
      expect(day.time, `${day.date} time`).toBe(SHIFT_TIMES[shift]);
      expect(day.poolId, `${day.date} pool`).not.toBe('-');
    }
  });

  test('Reverse check: profile to pool grid', async ({
    openOrNursingPool: pool,
    poolDirectoryPage,
    staffProfilePage: profile,
  }) => {
    const grid = await pool.readScheduleGrid();
    const { person, cell, weekDates } = await openFirstRosteredProfile(pool);
    await profile.waitForLoaded();

    // 1. On the profile, pick another day that shows OR-NUR-0001 in the current week
    let target: { shift: Shift; dayIndex: number } | undefined;
    for (const [dayIndex, date] of weekDates.entries()) {
      const a = await profile.readAssignment(date);
      const shift = a.shift as Shift;
      const isOriginal = shift === cell.shift && DAYS[dayIndex] === cell.day;
      const hasGridData = grid.some((g) => g.shift === shift && g.day === DAYS[dayIndex] && g.assigned !== null);
      if (a.poolId === orNursingPool.id && SHIFTS.includes(shift) && !isOriginal && hasGridData) {
        target = { shift, dayIndex };
        break;
      }
    }
    test.skip(!target, `${person.name} has no other OR Nursing Pool shift this week`);

    // 2. Go to Human Resource Pool → OR Nursing Pool and click the cell for that shift and date
    await reopenOrNursingPool(poolDirectoryPage, pool);
    await pool.openShift(target!.shift, DAYS[target!.dayIndex]);

    expect(await pool.readShiftDrawerHeading()).toBe(`${target!.shift} — ${weekDates[target!.dayIndex]}`);
    expect((await pool.readAssignedStaff()).map((s) => s.staffId)).toContain(person.staffId);
  });

  test("Another pool does not appear in this pool's drawer", async ({
    openOrNursingPool: pool,
    poolDirectoryPage,
    staffProfilePage: profile,
  }) => {
    const grid = await pool.readScheduleGrid();
    const { person, weekDates } = await openFirstRosteredProfile(pool);
    await profile.waitForLoaded();

    // 1. On the profile, find a day assigned to a different pool
    let target: { shift: Shift; dayIndex: number; poolId: string } | undefined;
    for (const [dayIndex, date] of weekDates.entries()) {
      const a = await profile.readAssignment(date);
      const shift = a.shift as Shift;
      const hasGridData = grid.some((g) => g.shift === shift && g.day === DAYS[dayIndex] && g.assigned !== null);
      if (a.poolId !== orNursingPool.id && a.poolId !== '-' && SHIFTS.includes(shift) && hasGridData) {
        target = { shift, dayIndex, poolId: a.poolId };
        break;
      }
    }
    test.skip(!target, `${person.name} has no other-pool shift this week`);

    // 2. In the OR Nursing Pool grid, open the same date and shift
    await reopenOrNursingPool(poolDirectoryPage, pool);
    await pool.openShift(target!.shift, DAYS[target!.dayIndex]);

    expect(
      (await pool.readAssignedStaff()).map((s) => s.staffId),
      `${person.staffId} works ${target!.poolId} that day`,
    ).not.toContain(person.staffId);
  });

  test('Mapping after a second demand change', async ({
    originalDemandBaseline,
    poolDetailsPage: pool,
    poolDirectoryPage,
    weeklyDemandPage,
    staffProfilePage: profile,
  }) => {
    test.setTimeout(12 * 60_000);
    const originalValue = originalDemandBaseline[SHIFTS.indexOf(demandChange.shift)][DAYS.indexOf(demandChange.day)];
    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, demandChange);
    const date = (await pool.currentWeekDates())[DAYS.indexOf(demandChange.day)];
    await pool.openShift(demandChange.shift, demandChange.day);
    const [person] = await pool.readAssignedStaff();
    expect(person, 'someone is rostered on the changed shift').toBeDefined();
    await pool.closeShiftDrawer();

    // 1. Change Late / Wed back to 0, save, and wait for rostering
    await changeDemandAndWaitForRoster(pool, weeklyDemandPage, { ...demandChange, value: originalValue });

    // 2. Open the Late / Wed cell
    const cell = await pool.readScheduleCell(demandChange.shift, demandChange.day);
    expect(cell.required).toBe(originalValue);
    await pool.openShift(demandChange.shift, demandChange.day);
    const stillAssigned = (await pool.readAssignedStaff()).some((s) => s.staffId === person.staffId);
    await pool.closeShiftDrawer();

    // 3. Open the profile of the person from 5.1
    const found = await pool.findShiftOf(person.staffId);
    test.skip(!found, `${person.name} is not rostered anywhere in this pool this week; profile unreachable from the grid`);
    await pool.viewAssignedStaff(person.staffId);
    await profile.waitForLoaded();

    const assignment = await profile.readAssignment(date);
    const showsLateInPool = assignment.shift === demandChange.shift && assignment.poolId === orNursingPool.id;
    expect(showsLateInPool, 'calendar matches the latest grid for the changed shift').toBe(stillAssigned);
  });
});
