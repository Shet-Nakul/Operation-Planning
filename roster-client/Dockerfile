FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty API base URL so the browser talks to this origin; nginx proxies /api and /auth.
ENV VITE_API_BASE_URL=
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# nginx image renders templates with envsubst at startup (only defined vars are replaced)
ENV SERVER_HOST=server
ENV SERVER_PORT=3000
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
