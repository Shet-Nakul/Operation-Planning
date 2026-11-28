# Rostering – Edit Weekly Demand → Regenerate Roster → Verify Staff Mapping

## Application Overview

In Karmarker Operation Planning (`http://localhost:5173`), each **Human Resource Pool** has a *Demand Baseline*: the required headcount per shift (Day / Early / Late / Night) for each weekday. When the baseline is saved, the solver re-runs rostering for the pool. The **Schedule Output** grid then shows `assigned/required` for each shift and day. Clicking a cell opens a drawer that lists the assigned staff. Each staff member's profile has an **Employee Calendar** that should show the same assignment.

This plan covers that end-to-end flow:
**Pool → Weekly Demand → edit → save → wait for rostering → read results → open a cell → open the assigned person's profile → verify the mapping.**

### Reference data (observed 2026-11-24, current week **Nov 23 - Nov 29, 2026**)

| Item | Value |
|---|---|
| Pool used | **OR Nursing Pool** (pool ID `OR-NUR-0001`, *Surgery • Main OR*) |
| Baseline (Mon→Sun) | Day `0 1 1 1 1 1 0` · Early `1 1 2 2 1 1 0` · Late `0 0 0 0 0 0 0` · Night `0 0 0 0 0 0 0` |
| Weekly Capacity | 104 Hours (total demand 13 × 8 h) |
| Shift times | Day `08:00 - 16:00` · Early `05:00 - 13:00` · Late `14:00 - 22:00` · Night `21:00 - 05:00` |
| Rostering duration | About 50–60 s after save |

### Key UI facts
- The editor is opened with **Edit Demand** (or **Edit Config**). Its page heading is **Weekly Demand Matrix**. It has a 4×7 grid of number inputs (rows Day/Early/Late/Night, columns Mon–Sun), a **Weekly Man-Hours** value, and the buttons **Back to Pool** and **Save Demand Baseline**.
- **Save Demand Baseline** sends `PUT /api/pools/OR-NUR-0001/demand` and returns the user to the pool page.
- While the solver runs, the Schedule Output section is replaced by:
  **"Generating this week’s roster…"** and *"Applying the updated weekly demand. This grid will refresh automatically when the solver finishes."*
  When the text disappears, the **Current Week Planning** grid is shown again with new results. No page reload is needed.
- Cell text format is `assigned/required` plus a status (e.g. `1/1 Fulfilled`). A Monday cell for a day already past may show `— No data`.
- Drawer heading format: `<Shift> — <YYYY-MM-DD>` (e.g. `Late — 2026-11-25`). Each row shows `<Name> <STAFF-ID> View`.
- Employee Calendar: each day is a button named `Assignments for YYYY-MM-DD`. Its contents are `<letter> <Shift> <PoolID> <time range>`, or `O Off - -`. The day the user arrived from is pre-selected (`aria-pressed="true"`), and a **Selected Day** panel shows `Shift: <Shift> (<letter>)`, `Pool: <PoolID>`, and `Time: <range>`.

## Common Setup (every scenario starts fresh)

Seed: `tests/seed.spec.ts`

1. Navigate to `http://localhost:5173`.
2. Fill in **Email** `admin@centralhospital.com` and **Password** `password123`, then click **Sign in**.
3. Click **Human Resource Pool** in the sidebar. Verify the heading **Pool Directory** is visible.
4. On the **OR Nursing Pool** card, click **View Details**.
5. Verify h1 **OR Nursing Pool**, the text **Surgery • Main OR**, and the **Current Week Planning** grid are visible.
6. Record the current **Demand Baseline** values. Every scenario that saves must restore them at the end (see *Cleanup*).

> Scenarios that save demand change shared data and trigger the solver. Run them **serially** (not in parallel) and allow up to **4 minutes** per save for rostering to finish.

---

## 1. Edit Weekly Demand and Save

### 1.1 Open the Weekly Demand editor with the current values
**Steps**
1. Click **Edit Demand**.

**Expected**
- The breadcrumb **Resource Pools › Weekly Demand Matrix** and h1 **Weekly Demand Matrix** are visible.
- The 28 inputs (Day/Early/Late/Night × Mon–Sun) exactly match the Demand Baseline table on the pool page.
- **Weekly Man-Hours** = (sum of all inputs) × 8, which is **104hrs** for the reference data.

**Failure**: Any input differs from the baseline table.
> The editor first renders a placeholder grid (3 rows with values such as 12/14/10) and swaps in the pool's real 4×7 demand once it loads. Reading or editing too early hits the placeholder. This explains the `8` seen during exploration. Wait for all 28 inputs before asserting.

### 1.2 Edit a cell and watch the live totals
**Steps**
1. In the editor, set **Late / Wed** from `0` to `1`.

**Expected**: **Weekly Man-Hours** updates immediately to **112hrs**.

### 1.3 Save the demand baseline
**Steps**
1. After 1.2, click **Save Demand Baseline**.

**Expected**
- A `PUT /api/pools/OR-NUR-0001/demand` request is sent. Its `demand_matrix` contains `{"shift":"Late", "wednesday":1, …}`, and all other values are unchanged.
- The app returns to the **OR Nursing Pool** page.
- The **Demand Baseline** table shows Late / Wed = **1**.

### 1.4 Discard without saving (negative)
**Steps**
1. Click **Edit Demand**. Set **Day / Mon** to `5`.
2. Click **Back to Pool**. Do not save.

**Expected**: The baseline still shows Day / Mon = **0**, no "Generating" state appears, and the Schedule Output grid is unchanged.

### 1.5 Invalid input is not saved (negative)
**Steps**
1. Click **Edit Demand**. In **Day / Mon**, type `-2`.

**Expected**: The value is clamped or rejected (the input has `min=0`), and **Weekly Man-Hours** never shows a negative number or `NaN`. If saved, the PUT payload never contains a negative number.

---

## 2. Wait for Rostering to Complete

### 2.1 The rostering loading state appears and then clears
**Steps**
1. Perform 1.2 and 1.3.
2. Right after returning to the pool page, check the Schedule Output section.
3. Wait for the loading message to disappear (timeout 240 s).

**Expected**
- The text **"Generating this week’s roster…"** and *"Applying the updated weekly demand…"* are visible, and the grid is hidden.
- The message disappears on its own within the timeout (about 50–60 s observed). No manual reload is needed.
- The **Current Week Planning** grid reappears with the range **Nov 23 - Nov 29, 2026**.
- No error toast or message appears.

**Failure**: The loading state never clears, the grid stays empty, or an error is displayed.

**Automation hint**
```ts
const generating = page.getByText('Generating this week’s roster…');
await expect(generating).toBeVisible();
await expect(generating).toBeHidden({ timeout: 240_000 });
await expect(page.getByRole('heading', { name: 'Current Week Planning' })).toBeVisible();
```

### 2.2 Navigating away during rostering (edge)
**Steps**
1. Save a demand change (1.2 and 1.3). While "Generating…" is shown, click **Resource Pools** in the breadcrumb, wait about 10 s, and open **OR Nursing Pool** again.

**Expected**: The page shows the "Generating…" state again (if the solver is still running) or the finished grid. It never shows a broken or partial grid.

---

## 3. Verify the Rostering Results

### 3.1 Required values reflect the new demand
**Steps**
1. After 2.1 completes, read every cell of the Schedule Output grid.

**Expected**
- For every shift and day that has data, the denominator equals the matching **Demand Baseline** value. In particular, **Late / Wed** shows `x/1` (it was `x/0` before).
- **Weekly Capacity** (right panel) shows **112 Hours**.

### 3.2 Coverage status is correct
**Steps**
1. Check the status of each cell.

**Expected**
- `assigned ≥ required` shows **Fulfilled**. Late / Wed was observed as `1/1 Fulfilled`.
- If `assigned < required`, the cell must **not** show Fulfilled, and **Alerts** should list the gap.

### 3.3 Results also change for the following week
**Steps**
1. Click the next-week arrow. The range becomes **Nov 30 - Dec 06, 2026**.

**Expected**: The Late / Wed denominator is also `1` (the baseline applies from its effective date onward). Clicking the previous arrow returns to the current week, where the previous arrow is disabled.

---

## 4. Open a Result Cell and Verify the Assigned People

### 4.1 The drawer matches the clicked day and shift
**Steps**
1. After rostering completes, click the **Late / Wed** cell (`1/1 Fulfilled`).

**Expected**
- A drawer opens with the heading **Late — 2026-11-25**, which is the Wednesday of the displayed week, and the text "Assigned staff for this shift."
- The number of staff rows equals the cell's assigned count (1).
- Each row shows the name, Staff ID, and **View**. Megan Roberts (STAFF-0310) was observed; the actual name can differ after each solver run.
- **Close** dismisses the drawer.

### 4.2 Check the drawer for several cells (data-driven)
**Steps**
1. For each clickable cell in the current week (skip `— No data`), open the drawer and compare the row count with the cell's `assigned` number.

**Expected**: For every cell, `assigned` = the number of people listed. The heading's shift name matches the row, and the heading's date matches the column (Mon = 2026-11-23 … Sun = 2026-11-29).

### 4.3 A zero-assignment cell (edge)
**Steps**
1. Click a `0/0` cell (e.g. **Late / Tue**).

**Expected**: The drawer shows no staff rows, ideally with an empty-state message, and no error occurs.

---

## 5. Go to the Profile and Verify the Mapping

### 5.1 The profile matches the drawer's day, shift, and pool
**Steps**
1. In the **Late — 2026-11-25** drawer, note the first person's **name** and **Staff ID**, then click **View**.

**Expected**
- A staff profile opens with the breadcrumb **Individuals › <Name>**. The h2 equals the name from the drawer, and **Employee ID** = `#<Staff ID>` from the drawer.
- **Pools** includes **OR Nursing Pool**.
- **Employee Calendar** opens on **November 2026**.
- The calendar day **Assignments for 2026-11-25** is pre-selected (`aria-pressed="true"`) and shows:
  - shift letter **L** and name **Late**,
  - pool **OR-NUR-0001**,
  - time **14:00 - 22:00**.
- **Selected Day** shows `2026-11-25`, `Shift: Late (L)`, `Pool: OR-NUR-0001`, and `Time: 14:00 - 22:00`.

**Failure**: A different shift or pool on that date, **Off**, a mismatched name or ID, or the pool missing from **Pools**.

### 5.2 One shift per person per day (consistency)
**Steps**
1. On the same profile, check every calendar day of the displayed month.

**Expected**: Each day shows exactly one assignment or **Off**. There are no duplicate or overlapping shifts, and the time shown for each shift letter matches the legend (D 08:00-16:00, E 05:00-13:00, L 14:00-22:00, N 21:00-05:00).

### 5.3 Reverse check: profile → pool grid
**Steps**
1. On the profile, pick another day that shows **OR-NUR-0001** (e.g. a Day or Early shift in the current week). Note the date and shift.
2. Go to **Human Resource Pool → OR Nursing Pool**, then click the cell for that shift and date.

**Expected**: The drawer for that cell lists this person.

### 5.4 Another pool does not appear in this pool's drawer (negative)
**Steps**
1. On the profile, find a day assigned to a different pool (e.g. **SCRUB-NUR-0001**).
2. In the OR Nursing Pool grid, open the same date and shift.

**Expected**: This person is **not** listed in the OR Nursing Pool drawer for that date and shift.

### 5.5 Mapping after a second demand change (regression)
**Steps**
1. Change **Late / Wed** back to `0`, save, and wait for rostering (as in 2.1).
2. Open the **Late / Wed** cell.
3. Open the profile of the person from 5.1.

**Expected**: The cell shows `x/0`. If the person is no longer assigned there, their calendar for **2026-11-25** no longer shows *Late · OR-NUR-0001*. The calendar always matches the latest grid, with no stale assignment.

---

## Cleanup (mandatory after any save scenario)

1. Open **OR Nursing Pool → Edit Demand**.
2. Restore the baseline recorded in Common Setup step 6 (reference: Day `0 1 1 1 1 1 0`, Early `1 1 2 2 1 1 0`, Late all `0`, Night all `0`).
3. Click **Save Demand Baseline** and wait for **"Generating this week’s roster…"** to disappear.
4. Verify that the Demand Baseline matches the original and that **Weekly Capacity** = **104 Hours**.

## Notes for automation
- After a solver run, the specific names in a cell can change. Assert relationships (drawer count = cell numerator, drawer person → calendar entry) rather than fixed names.
- Dates are relative to "today". Compute the Monday–Sunday dates from the **Current Week Planning** range text instead of hard-coding them.
- Demand inputs have no labels. Locate them by position: row index (Day=0, Early=1, Late=2, Night=3) × 7 + day index (Mon=0 … Sun=6). For example, Late / Wed = `getByRole('spinbutton').nth(16)`.
- When editing inputs, clear the field fully before typing (select all, then Backspace, then type). One restore attempt with `fill('0')` did not persist.
