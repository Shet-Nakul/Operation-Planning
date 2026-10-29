# Operation Planning API

Production-ready REST API server using Node.js, Express, TypeScript, MySQL (Prisma ORM), JWT authentication, role-based access control, Swagger docs, Zod validation, Winston logging, dotenv config.

## Features
- Persistent staff leave and shift-off requests with supervisor review
- Layered architecture: routes → controllers → services → repositories (models)
- JWT authentication & role-based access control
- Swagger (OpenAPI 3.0) API documentation
- Centralized error handling & logging
- Environment config using dotenv
- SQL migration files & seed data
- Dockerfile + docker-compose (MySQL + API)

## Folder Structure
```
src/
  config/
  db/
  models/
  repositories/
  services/
  controllers/
  routes/
  middlewares/
  docs/swagger.ts
  app.ts
  server.ts
```

## Setup
1. Copy `.env.example` to `.env` and update values
2. Run migrations & seed data
3. Start server

## Staff Requests and Supervisor Setup

1. Create staff profiles with their email addresses. Each staff login must use the same email as its staff profile.
2. In the existing Users page, an organization admin creates a regular `USER` account for each supervisor, using the supervisor staff profile's email. Supervisors retain ordinary user access; no general write permission is required to submit or review requests.
3. Set each direct report's Primary Supervisor to the supervisor's staff profile. The existing name selection works when unique; the Edit Profile supervisor field also accepts the supervisor's staff ID or email. `Hospital Admin` routes to active organization admin accounts, excluding the affected staff member. An assigned admin may submit and review leave on behalf of another staff member.
4. Configure active leave types under Settings. Staff submit requests through Staff Library > View Profile > New Request > Leave. Select Leave or Shift Off / Duty Modification, provide the dates and reason, and submit.
5. Assigned supervisors see the request inbox first in My Team, with Approve and Reject controls in the Decision column. Direct reports appear underneath. Their own profile's Request Center overview also includes requests routed to them. Only assigned reviewers can approve or reject pending requests; users cannot approve their own leave.
6. Approved requests appear on the staff profile calendar and Upcoming Time Off, and mark scheduling/planning for refresh. Leave uses `V`; shift off uses `O`. Dated overrides do not change the recurring weekly template. Rejected requests remain in history and do not change availability.

Shift swaps go directly to the assigned supervisor, then to any currently active hospital `ADMIN` in the same organization for final approval, regardless of the saved reviewer snapshot. An admin who submitted on behalf of another staff member may finalize; no admin can approve a swap for their own staff profile. Supervisor approval keeps the request `PENDING` with metadata stage `ADMIN`; only final admin approval marks it `APPROVED`. Either reviewer may reject at their stage. Pending legacy colleague-stage swaps also route to the current supervisor; colleague acceptance is no longer an approval step. Both a supervisor and an eligible admin account must exist to submit a swap.

Final swap approval immediately queues rostering for both participants' assigned pools, including connected pools sharing staff. Participants must still belong to the organization and have assigned pools. The solver receives the requester's preferred shift and the colleague's original shift; conflicting saved assignments are unpinned on swap dates. The rerun horizon includes the requested dates. Scoped results merge into existing roster views without deleting unrelated employees, pools, or dates. Jobs wait while another run is active, failed starts/runs remain queued for the next auto-trigger tick, and changes arriving mid-run are not discarded. The pending queue is in memory (like the existing dirty-trigger queue); server restarts do not retain queued reruns. Rostering requires the configured roster solver to be available. Surgery planning is marked dirty using the existing planning mechanism; this does not enable its disabled auto-trigger.

All staff logins have Home and My Team navigation. My Team includes their own requests and requests visible to them for review; hospital admins have My Team regardless of direct reports. Red numbered badges count only pending requests the signed-in account can act on, refreshing every 15 seconds, on window focus, and after local submissions or decisions.

The existing `/api/staff-requests` API persists requests and reviewer IDs in request metadata. Pending request access is resolved from the staff member's current supervisor assignment, including requests with missing or outdated reviewer metadata; the routing snapshot is saved when reviewed. `GET /api/staff-requests/team` returns direct reports and the signed-in user's staff profiles. `PUT /api/staff-requests/:id` accepts only `{ "status": "APPROVED" }` or `{ "status": "REJECTED" }`. Only the original requester may withdraw a pending request with DELETE.

Run focused workflow tests from the workspace root:

```sh
node --test server/scripts/staff-requests.test.cjs
node --test server/scripts/swap-rostering.test.cjs
```

## Database Schema
- organizations
- planning_global_config
- resources
- resource_daily_capacity
- resource_availability_windows
- phase_requirements
- operations
- operation_types
- infection_types
- surgery_phase_requirements
- surgery_phase_assigned_resources
- surgery_phase_candidate_resources
- users
- roles
- user_activity_logs

## API Documentation
See Swagger UI at `/docs` endpoint after server start.

The starter seed provisions the system-wide Super Admin account:

- Email: `superadmin@karmarker.com`
- Password: `Karmarker@2026`

Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` before deployment to override these development defaults. Change the defaults before exposing a deployment publicly.

mysql -u root -p

GRANT ALL PRIVILEGES ON *.* TO 'op_user'@'localhost';
FLUSH PRIVILEGES;
exit;

npx prisma migrate dev --name init
npm run seed

npm run dev

## Example API Usage

### Create a Role

```json
POST /api/roles
Content-Type: application/json

{
  "name": "ADMIN",
  "description": "Administrator role"
}
```

**Curl Example:**
```sh
curl -X POST \
  'http://127.0.0.1:3333/api/roles' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"name": "ADMIN", "description": "Administrator role"}'
```
**To seed the database**
```sh
npx prisma db seed
```
**Kill any running ts-node-dev processes**
```sh
pkill -f ts-node-dev
```
** Then restart**
```sh
npm run dev
```
