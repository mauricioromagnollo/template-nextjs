# syntax=docker/dockerfile:1

# Production image for the Next.js template.
#
# Relies on `output: 'standalone'` in next.config.ts: Next traces the modules the
# server actually imports and emits a self-contained bundle under
# `.next/standalone`, so the runner stage never needs node_modules or a package
# manager. The result is a small image with a minimal attack surface.
#
# There are no build-time secrets here (this template ships without a CMS), so no
# BuildKit secret mount is needed. The only build-time inputs are the
# `NEXT_PUBLIC_*` variables: Next inlines them into the client bundle at build
# time, which means they must be present when `next build` runs, and a value
# baked into a public bundle is public by definition.
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_SITE_URL="https://example.com" \
#     --build-arg NEXT_PUBLIC_SITE_NAME="My Site" \
#     -t template-nextjs:latest .
#
# Run:
#   docker run --rm -p 3000:3000 template-nextjs:latest
#
# Rebuild the image whenever a NEXT_PUBLIC_* value changes — it cannot be
# overridden at `docker run` time.

# ------------------------------------------------------------------------------
# Stage 1 — builder
# ------------------------------------------------------------------------------
FROM node:26.5.0-slim AS builder

WORKDIR /app

# The `node` user (uid/gid 1000) ships with the official image; own /app so the
# build never runs as root.
RUN chown node:node /app
USER node

ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies are installed in their own layer: it is only invalidated when the
# manifests change, so ordinary source edits reuse the cached npm install.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

# Public, build-time-only configuration. Defaults keep `docker build` working
# with no arguments; override them for real deployments.
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ARG NEXT_PUBLIC_SITE_NAME="Next.js Template"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_SITE_NAME=${NEXT_PUBLIC_SITE_NAME}

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2 — runner
# ------------------------------------------------------------------------------
FROM node:26.5.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to every interface — the default (localhost) is unreachable from outside
# the container.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

USER node

# Static assets and anything under public/ are served by the standalone server
# but are not part of the traced bundle, so they are copied explicitly.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE ${PORT}

# Uses the runtime's own fetch — no curl/wget in the slim image, nothing extra to
# install.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
