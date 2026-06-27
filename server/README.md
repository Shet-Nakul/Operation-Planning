# Operation Planning API

Production-ready REST API server using Node.js, Express, TypeScript, MySQL (Prisma ORM), JWT authentication, role-based access control, Swagger docs, Zod validation, Winston logging, dotenv config.

## Features
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

In /login
use this
{
  "email": "superadmin@example.com",
  "password": "password123"
} 

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
