# Leave request and supervisor review test plan

## Scope and evidence

This plan covers Megan Roberts submitting leave and her immediate supervisor, Dr. Michael Anderson, reviewing it. Exploration on 25 November 2026 confirmed that both users can sign in, Megan has a Request Center > Leave form, and Michael's My Team > Direct Reports includes Megan (STAFF-0310). The request and decision paths below are test scenarios, not executed results: no leave was submitted or reviewed during exploration.

The referenced `planningPayloadPreparer.ts` prepares surgery-planning payloads; it is not the leave workflow or a test-planning agent. This plan follows the repository's Playwright planner format, but the Playwright planner agent and its save tool were not available in this session.

## Test setup

- Use an isolated, disposable test environment with the frontend and API running, an active Vacation leave type, and Megan assigned to Michael as supervisor. Approval can trigger planning and scheduling work; do not run mutation scenarios against shared or production data without permission.
- Use the supplied Megan and Michael credentials through a secure test secret store; never commit passwords, tokens, or authenticated browser state.
- Start each scenario with fresh browser contexts and an independent clean fixture. If a scenario requires a pending request, create one within that scenario using the submission steps below. Do not reset or delete other users' data.
- For each created request, use a unique test marker in Notes & Justification and a future date range not used by another scenario. Record its request ID and baseline counts. Prefer deterministic fixtures and a controlled clock.
- Observe the UI and, where useful, the authenticated `/api/staff-requests` responses. Refresh or reopen pages before checking persistence. Use separate contexts for the requester and reviewer.
- Clean up only test-owned records through an approved fixture/reset process in the isolated environment. The API permits withdrawal only by the requester while pending; reviewed requests require a test-environment reset rather than a withdrawal.

### Running the first two automated scenarios

The `credentials` object and date generation are centralized in `test-data/leave.ts`, following the rostering test-data pattern. Password values come from configuration rather than hardcoded secrets.

1. Copy `.env.example` to `.env.local` in the automation directory if the local file does not exist.
2. Enter the test account passwords in `LEAVE_MEGAN_PASSWORD` and `LEAVE_MICHAEL_PASSWORD` in `.env.local`. This file is ignored by Git; never commit it.
3. Point `BASE_URL` at the isolated test frontend and set `LEAVE_E2E_ALLOW_MUTATIONS=1` to enable the leave tests. They are skipped otherwise.
4. Run `npx playwright test leave` from the automation directory, or run the tests from VS Code's Testing sidebar.

Playwright automatically loads `.env.local` relative to its configuration file, regardless of the working directory. This uses Node.js's built-in `parseEnv` (Node.js 20.12+). Values in `.env.local` override existing environment variables, so stale terminal or VS Code passwords cannot replace the local settings. Without a local file, CI can supply the environment variables directly.

The tests create persistent requests, including an approved request that can trigger planning and scheduling; reset the isolated environment afterward.

## Scenarios

### 1. Submit leave and route to the immediate supervisor

**Starting state:** No request with this scenario's marker exists.

1. Sign in as Megan, select **Request Center > Leave**, and confirm **Leave (Time-Off)** and an active **Vacation** request type are available.
2. Enter a future start and end date and a unique note; select **Submit Request** once.
3. Open **My Request**, select **Leaves**, and find the request by its marker. Refresh and locate it again.
4. In a separate context, sign in as Michael, open **My Team**, search **Staff Requests** for the marker or Megan, and refresh if necessary.

**Expected:** Exactly one request exists with Megan's identity, matching leave type, dates and note, and pending/awaiting-supervisor status. Michael sees the same request with Approve and Reject actions. Megan sees the request but cannot approve her own leave. Pending counts reflect the new record.

### 2. Approve a pending leave request

**Starting state:** Create a unique pending request as in scenario 1; note the original approved-leave day count and calendar values.

1. As Michael, find the request in **My Team > Staff Requests**, select **Approve**, and check the confirmation.
2. Select the **Approved** status filter and find the same request; refresh the page.
3. As Megan, refresh **My Request** and **Request Center > Leave**; inspect the request, Recent Activity, and approved-leave total.
4. Reopen Megan's Home calendar and inspect each date in the approved range.

**Expected:** The request remains Approved after refresh, disappears from the pending filter, and no longer offers review actions. Megan sees Approved and the approved-leave total increases by the inclusive number of calendar days. Approved dates appear as leave on the calendar. No assertion is made about a completed solver run unless the test environment exposes and verifies it.

### 3. Reject a pending leave request

**Starting state:** Create a separate pending request as in scenario 1; capture the approved-leave count and calendar entries for its dates.

1. As Michael, find the request and select **Reject**.
2. Select the **Rejected** status filter and refresh.
3. As Megan, refresh **My Request**, **Request Center > Leave**, and the Home calendar.

**Expected:** The request persists as Rejected, is absent from Pending, and cannot be reviewed again. Megan sees the rejection; the approved-leave total and calendar are not changed by this rejected request.

### 4. Required dates and reversed range

**Starting state:** Sign in as Megan with a fresh form.

1. Attempt submission with both dates empty, then with only one date populated.
2. Enter an end date earlier than the start date and attempt to submit; use an API-level invalid request if the date input prevents this combination.
3. Inspect personal requests and Michael's pending list.

**Expected:** Required-date validation prevents empty submissions. A reversed range is rejected by the form or API, with an error or native validation indication. No request is created or routed for any invalid attempt.

### 5. Date and request-type boundaries

**Starting state:** Use a fresh isolated fixture for each case.

1. Submit a same-day Vacation request; approve it as Michael.
2. Create a request with an end date exactly 365 days after the start date, and separately attempt one with an end date 366 days after the start date.
3. At the API boundary, try an invalid calendar date, an inactive or nonexistent leave type, and a missing leave type.

**Expected:** A valid same-day request can be approved and contributes one approved day. The 365-day difference is accepted; the 366-day difference, invalid date, and invalid or missing leave type are rejected without creating requests. Check actual start/end dates rather than assuming a calendar year has a fixed duration.

### 6. Optional notes and form preservation on failure

**Starting state:** Megan has a fresh form and an active supervisor.

1. Submit a valid request with Notes & Justification empty.
2. In a separate case, simulate an API failure when submitting a valid request with a unique note.
3. Restore the API and inspect both personal and supervisor lists before retrying.

**Expected:** Empty notes are accepted and the request routes normally. On a failed submission, an error is visible, the entered values remain available, and no request is claimed as successfully submitted. Verify the server outcome before retrying if the response was lost to avoid accidental duplicates.

### 7. Missing or invalid supervisor

**Starting state:** In an isolated fixture only, remove Megan's supervisor assignment or link it to an inactive/nonexistent account; retain a separate normal fixture for other scenarios.

1. Sign in as Megan and submit a valid Vacation request.
2. Inspect the error and both request lists.

**Expected:** Submission fails with a message that an active, other supervisor is required; no pending request is created. Restore the isolated fixture using its normal teardown.

### 8. Unauthorized access and review

**Starting state:** Create a fresh pending request; provide a separate active user who is neither Megan nor her assigned supervisor.

1. As that user, search for the request and attempt to read and approve its ID through the API.
2. As Megan, attempt to approve her own pending request through the API.
3. As Michael, verify that the pending request remains reviewable.

**Expected:** The unrelated non-admin user cannot see or read/review the request, and Megan cannot approve it. Unauthorized API operations return 403 without changing status. Michael retains the ability to review it. Administrator visibility is a separate permission and should not be assumed absent.

### 9. Duplicate decisions and concurrent review

**Starting state:** Create a fresh pending request and open two independent Michael contexts.

1. Locate the same pending request in both contexts.
2. Approve it in one context; attempt to reject the same request from the stale second context or API.
3. Refresh both contexts and Megan's personal request list.

**Expected:** Only the first decision is persisted. The stale decision receives a conflict or equivalent visible error, and all refreshed views agree on the final status.

### 10. Supervisor list filters and refresh

**Starting state:** Create independent marked pending, approved, and rejected Megan requests in an isolated fixture.

1. As Michael, search **Staff Requests** using each unique marker.
2. Switch between Pending, Approved, Rejected, and All; use **Refresh** and reload the page.
3. Search **Direct Reports** for Megan.

**Expected:** Each status filter displays only matching records and All includes all three. Search finds the correct request without changing its state; Megan remains listed as a direct report.

### 11. Coverage forecast: display versus actual coverage

**Starting state:** Megan has a fresh Leave form; no request is submitted.

1. Select **Check Unit Coverage** without dates and inspect the forecast; acknowledge it.
2. Enter two different date ranges in turn, including a fixture with known conflicting absences, and open the forecast for each.
3. Compare the displayed coverage and conflict values to the controlled fixture's actual roster and absences.

**Expected:** The displayed schedule reflects entered dates, the dialog can be closed, and checking coverage does not create a request. Flag a defect if the UI claims a live/safe result inconsistent with the fixture; the explored implementation currently displays fixed 92% capacity, zero conflicts, and 12 listings even with no dates, so it must not be treated as verified real coverage.

### 12. Overlap and duplicate submission policy

**Starting state:** Create one marked pending leave request in an isolated fixture.

1. Attempt an identical request and a partially overlapping request with distinct notes.
2. Record whether each is accepted, warned, or blocked, and inspect Michael's list for every created record.

**Expected:** Compare the observed behavior with the agreed product policy. Overlap and duplicate handling are not specified by the explored workflow, so do not assume rejection; report unintended duplicates or missing warnings against the confirmed requirement.

## Exit criteria

All applicable scenarios pass in the isolated environment; failures capture the request ID, steps, expected and actual state, and sanitized evidence. Resolve or explicitly accept the coverage-forecast limitation and any unspecified overlap policy before treating the workflow as release-ready.
