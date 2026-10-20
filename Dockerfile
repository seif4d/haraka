# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
ENV HARKA_STANDALONE=1
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TZ=Africa/Cairo \
    HARKA_DATABASE_PATH=/app/.data/harka.sqlite
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Keep the explicit, optional schedule-import command available in Coolify Terminal.
COPY --from=builder --chown=node:node /app/lib/curriculum.ts /app/lib/training-experience.ts /app/lib/lesson-blocks.ts /app/lib/lesson-links.ts ./lib/
COPY --from=builder --chown=node:node /app/data ./data
COPY --from=builder --chown=node:node /app/scripts/import-third-year-schedules.cjs /app/scripts/import-fourth-year-schedules.cjs /app/scripts/import-second-year-schedules.cjs /app/scripts/import-first-year-schedules.cjs /app/scripts/create-training-experience.cjs /app/scripts/import-training-principles.cjs /app/scripts/upgrade-training-lessons.cjs /app/scripts/start-container.cjs /app/scripts/healthcheck.cjs /app/scripts/backup-database.cjs ./scripts/
RUN mkdir -p /app/.data && chown node:node /app/.data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "scripts/healthcheck.cjs"]
CMD ["node", "scripts/start-container.cjs"]
