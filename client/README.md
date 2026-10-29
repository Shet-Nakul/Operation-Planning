<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dec6a51c-1513-486c-a108-5e2428e49b71

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Staff requests

Staff logins have **Home** (the employee calendar), **Request Center** (the previous Home overview, availability, leave submission, and shift swaps), **My Request** (personal request overview and status tracking only), and **My Team** (direct reports and their requests) in the sidebar. Home shares the Employee Calendar component used in the admin staff profile, including month navigation, shift legends, pool/time details, day selection, and approved requests. It merges all saved roster horizons for the signed-in employee. My Request has no Leave or Shift Swap options. Personal request tables and status cards are under My Request, not Overview. A successful leave submission displays a persistent green confirmation, including after returning to Overview in Request Center.

Request Center displays its Schedule & Time-Off calendar at full content width, without a Policy Update panel or guidelines modal. On smaller screens the calendar scrolls within its card.

The staff Home and Request Center calendars initially open the current local month with today's date selected, even if saved assignments are in another month. Selecting a date is tied to its full date, so navigating months does not highlight the same day number in an unrelated month.

The staff sidebar can collapse on desktop and stays compact on smaller screens. Sign out is at the bottom-left; the profile avatar sits to the right of the name in the top-right header. Users without reportees see a My Team empty state instead of request and team tables. Hospital admins retain their organization-wide approval view.

Shift swaps route to the supervisor first, then the hospital admin for final approval. My Team displays the current approval stage. The red sidebar badge counts requests requiring the signed-in account's approval, not requests awaiting another reviewer. Counts refresh after local changes, on window focus, and every 15 seconds.

After supervisor approval, any eligible active admin in the organization can finalize the swap from My Team, including admins without direct reports. Final approval confirms that affected-pool rostering has been queued. Approved swaps show the preferred (new) shift on the employee calendar rather than the original shift.

My Team uses the Personnel Library table styling for requests and direct reports, with staff identity columns, status badges, search controls, and independent 10-row pagination. Tables scroll within their cards on smaller screens; background refreshes preserve the table layout and current filters.

## Administration directories

Users and Activity Log share the directory-style table cards, summary metrics, identity avatars, badges, and numbered pagination. Both retain server-side page sizes and current-page search; summary metrics explicitly distinguish page-level counts from totals. User creation and inline editing remain available, and activity details open from either a row or its View Details button. Wide tables scroll inside their cards on smaller screens.

## Staff self-service profile

Staff accounts open **My Profile** from the sidebar or their header avatar. This read-only personal layout shows the staff record linked to the signed-in email: contact information, department and supervisor, creation/update dates, contract summary, skills, certifications, roles and allocation, pool memberships, and approved upcoming time off. The profile does not display a calendar or Standard Weekly Template; schedule information remains outside My Profile, with the employee calendar available on Home. All profile details come from saved staff records and related pool, contract, and approved request records. Missing fields are labelled as unrecorded rather than filled with demo values. Related-data failures are reported without hiding the saved staff details. Use Refresh profile to reload current information; changes must be made by an administrator.

## Surgery phase assignments

In Surgery Requests, Step 2, use **Manage** on a phase resource. Selection depends entirely on the
resource's **role** — department is not used to filter candidates:

- Human resources offer **Staff** and **Pool**. Options must match a complete configured resource
  role, not merely share a keyword or skill. Staff are matched by their effort/schedule roles and
  human pools by their primary role.
- Choose staff directly to pin specific people, or select a pool and click **Add pool** to let the
  solver fill all required positions from that pool.
- Equipment, bed and room resources offer non-human pools whose **role** matches the configured
  resource role. The backend `RenewableResourcePool` has no dedicated role column, so the role is
  derived from the pool name (dropping a trailing "Pool", e.g. `IV Pump Pool` → `IV Pump`), falling
  back to the `resource_type` (`EQUIPMENT`, `BED`, `ROOM`, …). This mirrors the planning payload
  preparer on the server.
- Equipment can be assigned as a whole pool or as specific units. Remove existing assignments before
  switching to a whole pool.

Explicit resource roles take precedence over the resource name. Matching ignores case, spacing, and
punctuation and uses the existing backend role-name mappings.

Focused regression checks (from the client directory):

```powershell
node --import tsx --test automation\tests\surgery-request\phase-resource-assignments.test.ts
cd automation
npx playwright test phase-resources.spec.ts
```

Browser tests use an isolated fixture and mocked equipment responses; they do not require hospital data or a running backend.
