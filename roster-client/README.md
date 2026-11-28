# Staff rostering client

This is a separate React client for staff rostering. It uses the existing API,
database, authentication and rostering solver; it does not replace the original
client or contain the automation suite.

## Run locally

Use Node.js 22, start the existing backend and solver, then:

```powershell
cd roster-client
npm ci
npm run dev
```

Open http://localhost:5174. The development proxy forwards `/api` and `/auth`
to http://localhost:3000 by default. To use a different backend, create
`roster-client/.env.local` with `ROSTER_SERVER_ORIGIN=http://localhost:8010`
(adjust the address as needed), then restart Vite. Do not put credentials in
this file. Alternatively, `VITE_API_BASE_URL` sets the browser API origin;
that server must allow the client origin via CORS.

## Roles and workflows

- Organization admins manage staff, contracts, pools, demand, rosters, staff
  requests, users, organization details and rostering settings.
- Staff sign in to see their calendar, profile, leave and swap requests, and
  supervisor approvals.
- Superadmins manage organizations and organization administrators.

Accounts are created through the existing administrative interfaces; there is
no public registration. Staff accounts must have a staff record with the same
email address. Access and organization isolation are enforced by the existing
backend. Both clients use the same backend data and roster generation jobs.
The administrator sidebar can be collapsed using the button at its bottom.
Organization details and staff-related statistics are available under
**Organization**. The current backend does not support clearing an existing
organization contact email.

Settings include shifts, leave types, departments, skills, specializations,
staff roles, global shift rules and the roster planning horizon. Saving the
horizon uses the backend's shared global settings endpoint.

## Validate and deploy

Run `npm test`, `npm run lint` and `npm run build`. The included Dockerfile builds the app
and serves it through nginx. Set `SERVER_HOST` and `SERVER_PORT` for nginx to
reach the API (defaults: `server` and `3000`); publish container port 80 on a
different host port from the original client.
