# Docker

Two images with different jobs: `Dockerfile` builds a small production image, `Dockerfile.dev` backs
the development compose stack. Neither is required to use the template — Vercel ignores both — but
they are what make it portable.

## The production image

```bash
make docker-build
docker run --rm -p 3000:3000 template-nextjs:latest
```

### Why it is small: `output: 'standalone'`

```ts title="next.config.ts (excerpt)"
// Emits a self-contained server bundle under `.next/standalone`, which is what
// the production Dockerfile copies. Harmless on Vercel, essential everywhere else.
output: 'standalone',
```

With this flag, `next build` traces the modules the server actually imports and copies them, plus a
minimal `server.js`, into `.next/standalone`. The runtime stage then needs **no `node_modules`, no
package manager and no `package.json`** — just Node and that directory.

The consequence is both size and attack surface: build-time-only packages (TypeScript, ESLint,
Vitest, Playwright, the entire dev dependency tree) never reach the shipped image, so a CVE in any of
them is not a CVE in your container.

### Stage 1 — builder

```dockerfile title="Dockerfile (excerpt)"
FROM node:24.16.0-slim AS builder

WORKDIR /app

RUN chown node:node /app
USER node

ENV NEXT_TELEMETRY_DISABLED=1

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ARG NEXT_PUBLIC_SITE_NAME="Next.js Template"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_SITE_NAME=${NEXT_PUBLIC_SITE_NAME}

RUN npm run build
```

Four decisions worth naming:

**The image tag matches `.node-version`.** `node:24.16.0-slim`, not `node:24-slim` and not
`node:lts`. The exact same runtime in CI, in Docker and on your machine.

**Manifests are copied before the source.** Docker caches per layer, and a layer is invalidated by
its inputs. Copying `package.json` and `package-lock.json` first means the `npm ci` layer survives
every source edit — you only reinstall when a dependency actually changes.

**`npm ci`, not `npm install`.** Lockfile-exact, and it fails if the manifest and lockfile disagree,
instead of quietly resolving something new.

**The build runs as `node`, not root.** The official image already ships that user at uid 1000;
`chown` on `/app` is what lets it write there.

### Stage 2 — runner

```dockerfile title="Dockerfile (excerpt)"
FROM node:24.16.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

USER node

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
```

**`HOSTNAME=0.0.0.0`** is not optional. Next binds to `localhost` by default, which inside a
container means the container's own loopback — unreachable from the host, no matter what you publish
with `-p`. The single most common "my container starts but I get connection refused" cause.

**Three copies, not one.** `.next/standalone` contains the traced server, but neither `public/` nor
`.next/static` is part of the trace — they are assets, not modules. The standalone server serves them
from those exact paths, so both have to be copied explicitly. Miss `.next/static` and the page loads
with no CSS and no JavaScript.

**The healthcheck uses the runtime's own `fetch`.** No `curl`, no `wget`, nothing extra to install
into a slim image and nothing extra to keep patched. Docker (and Compose, Swarm, or a Kubernetes
readiness probe modelled on it) can then tell "the process is up" from "the app is answering".

**`node server.js`, not `npm start`.** No npm process in the tree, so signals reach Node directly and
`docker stop` performs a clean shutdown instead of a ten-second timeout.

---

## Build-time `NEXT_PUBLIC_*`

!!! danger "This trips up everyone once"

    Next **inlines** every `process.env.NEXT_PUBLIC_*` reference into the JavaScript bundle during
    `next build`. By the time the container runs, those values are string literals inside minified
    files. Passing `-e NEXT_PUBLIC_SITE_URL=…` at `docker run` time changes nothing.

They must be build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL="https://example.com" \
  --build-arg NEXT_PUBLIC_SITE_NAME="My Site" \
  -t template-nextjs:latest .
```

Practical consequences:

- **One image per environment.** Staging and production need different `NEXT_PUBLIC_SITE_URL`, so
  they are different builds. That is a property of client-side configuration, not of this Dockerfile.
- **A URL change means a rebuild.** There is no runtime override.
- **Never pass a secret as a build argument.** `ARG` values are visible in `docker history`, and
  anything under `NEXT_PUBLIC_` is shipped to the browser regardless. Server-only secrets belong in
  runtime environment variables (`APP_ENV` is one) or a BuildKit secret mount.

The template ships without a CMS and therefore without build-time secrets, which is why there is no
`--mount=type=secret` in the Dockerfile. Add one if your project acquires an API key it needs at
build time.

---

## The development stack

```yaml title="docker-compose.yaml (shape)"
name: template-nextjs

services:
  app: # (1)!
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: template-nextjs-app
    restart: unless-stopped
    env_file:
      - path: .env
        required: false # (2)!
    environment:
      PORT: ${PORT:-3000}
    ports:
      - '${PORT:-3000}:${PORT:-3000}'
    volumes:
      - ./:/app # (3)!
      - /app/node_modules # (4)!
    stdin_open: true
    tty: true
```

1.  The service is named `app`, which is why `make shell` runs `docker compose exec app bash` and
    `make logs` follows `app`. Override it with `make shell SERVICE=…` if you rename it.
2.  `required: false` keeps `docker compose up` working on a fresh clone, before anyone has run
    `make setup` to create `.env`.
3.  Bind mount: your working tree *is* the container's `/app`, so edits are picked up immediately.
4.  Anonymous volume: keeps the container's `node_modules` from being shadowed by the host's. Native
    modules built for macOS would not run on the Linux container.

`NODE_ENV=development` is set in `Dockerfile.dev`, not here, so it cannot be lost by editing the
compose file.

```bash
make up        # build (first run) and start, detached
make logs      # follow the output
make shell     # open a shell inside the running container
make restart   # restart the service
make stop      # stop without removing
make down      # stop and remove containers
make clean     # remove every git-ignored artefact — including node_modules/
make docker-clean  # remove containers, volumes and images for this project
```

### Why the dev image runs as root

```dockerfile title="Dockerfile.dev (excerpt)"
# This stage deliberately runs as root: with a bind mount, the container writes
# into the host working tree, and a fixed uid would break for anyone whose host
# uid is not 1000.
```

The alternative — hard-coding `USER node` (uid 1000) — works for most Linux users, breaks for anyone
whose host uid differs, and behaves differently again on Docker Desktop for macOS. Root plus a
documented cleanup path is the trade-off that works for everyone.

The cost: files the container generates (`.next/`, `coverage/`) can end up root-owned on the host.
`make clean` handles that with a `sudo` fallback.

!!! warning "`Dockerfile.dev` is for development only"

    It runs as root, sets `NODE_ENV=development`, installs the full dependency tree and starts the
    dev server. Never deploy it.

---

## Deploying the image

The image is a plain Node HTTP server on `$PORT`. Anything that runs a container runs it: AWS ECS or
App Runner, Google Cloud Run, Azure Container Apps, Fly.io, Railway, Render, DigitalOcean App
Platform, Kubernetes, or a VPS with Docker installed.

```bash
# Build for the target platform — your Apple Silicon laptop is not amd64.
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL="https://example.com" \
  --build-arg NEXT_PUBLIC_SITE_NAME="My Site" \
  -t ghcr.io/<owner>/<repo>:1.0.0 .

docker push ghcr.io/<owner>/<repo>:1.0.0

docker run -d \
  --name my-site \
  -p 80:3000 \
  -e APP_ENV=production \
  --restart unless-stopped \
  ghcr.io/<owner>/<repo>:1.0.0
```

Things to get right on a real host:

| Concern | What to do |
| --- | --- |
| **TLS** | Terminate it in front — a load balancer, Caddy, nginx or Traefik. The container speaks plain HTTP. |
| **`APP_ENV`** | Set it to `production` at runtime. Nothing in the shipped code branches on it yet, but it is the flag any environment-specific behaviour you add will read — starting with `robots.ts` if you gate indexing on it. |
| **Platform** | Build with `--platform linux/amd64` (or `--platform linux/arm64`) to match the host. |
| **Tags** | Deploy an immutable tag, never `latest`. `latest` makes rollbacks a guess. |
| **Health** | Point the platform's health probe at `/`. The image already has a `HEALTHCHECK` for plain Docker. |
| **Logs** | The server writes to stdout/stderr. Let the platform collect them; do not log to a file inside the container. |

!!! note "Why keep this at all when the template targets Vercel?"

    Portability, and dev/prod parity. Vercel is the recommended path and stays a two-click deploy,
    but a template that can only run on one vendor is a template with a hostage clause. The reasoning
    is recorded in [ADR 0004](../decisions/0004-standalone-output-and-docker.md).

---

## Troubleshooting

??? question "Connection refused, but the container is running"

    `HOSTNAME=0.0.0.0` is missing or was overridden. Next bound to loopback inside the container.

??? question "The page renders with no styles"

    `.next/static` was not copied into the runner stage, or `public/` is missing. Both are separate
    `COPY` lines for a reason.

??? question "`NEXT_PUBLIC_SITE_URL` still points at localhost in production"

    It was passed at run time instead of build time. Rebuild with `--build-arg`.

??? question "Hot reload does not work in compose"

    Confirm the bind mount is in place. On macOS and Windows, filesystem events frequently do not
    cross the mount boundary; the template does not set `WATCHPACK_POLLING`, so add
    `WATCHPACK_POLLING: 'true'` under `environment:` in `docker-compose.yaml` if you hit it. Polling
    costs a little CPU and makes reload reliable.

??? question "`.next` is owned by root on my host"

    Expected — see above. `make clean`.

??? question "`exec format error` on the server"

    Architecture mismatch. Rebuild with `--platform linux/amd64` (or use `docker buildx` for a
    multi-arch image).
