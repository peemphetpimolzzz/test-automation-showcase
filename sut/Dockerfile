# Multi-stage build. The build stage carries the toolchain that better-sqlite3
# (a native addon) needs to compile, plus devDependencies for running tests.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Build toolchain for the native better-sqlite3 addon.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json vitest.config.ts ./
COPY src/ src/
COPY tests/ tests/
RUN npm run build

# Runtime stage: only production deps, compiled output, non-root user.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_FILE=/data/tasks.db

COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN npm prune --omit=dev \
    && mkdir -p /data \
    && chown -R node:node /app /data

USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=15s \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
CMD ["node", "dist/server.js"]
