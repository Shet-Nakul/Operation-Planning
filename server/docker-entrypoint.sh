#!/bin/sh
set -e

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database from seed-new..."
node dist/db/db-starter-seed.js

echo "Starting API server..."
exec node dist/server.js
