# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Base: Node 22 slim with OpenSSL required by Prisma engines
# -------------------------------------------------------------
FROM node:22-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------------------
# Dependencies: Install npm workspace dependencies and Prisma
# -------------------------------------------------------------
FROM base AS dependencies
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN npm install

# Generate Prisma Client
RUN npm run prisma:generate -w backend

# -------------------------------------------------------------
# Builder: Build frontend assets for production
# -------------------------------------------------------------
FROM dependencies AS builder
WORKDIR /app

COPY frontend ./frontend
RUN npm run build -w frontend

# -------------------------------------------------------------
# Runner: Production container executing monorepo backend + SPA
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace dependencies (including generated Prisma Client)
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json

# Copy backend application
COPY backend ./backend

# Copy compiled frontend assets
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/app.js"]
