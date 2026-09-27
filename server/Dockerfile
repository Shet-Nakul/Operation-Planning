FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Container seeding uses db-starter-seed only; never ship or compile seed.ts
RUN rm -f src/db/seed.ts \
 && npm pkg set prisma.seed="node dist/db/db-starter-seed.js" \
 && npm pkg set scripts.seed="node dist/db/db-starter-seed.js"

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
