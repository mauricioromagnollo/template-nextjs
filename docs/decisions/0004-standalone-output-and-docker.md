# ADR-0004 — Ship `output: 'standalone'` and a production Dockerfile

## Status

**Accepted** — 2026-07-25

## Context

The template is opinionated about deployment: Vercel is the recommended target, `vercel.json` is
committed, and two workflows deploy previews and production through the Vercel CLI. Vercel builds the
application with its own build output format and **ignores `output: 'standalone'` entirely**.

So the honest question is: why carry a Dockerfile and a config flag that the primary deployment path
does not use?

Three forces push back on "just use Vercel and delete the container".

**Portability is a property people evaluate before adopting.** A template that only runs on one
vendor is a template with a hostage clause. Plenty of teams cannot use Vercel — a company standard on
AWS or GCP, a compliance requirement about where the workload runs, an existing Kubernetes platform,
or a cost profile where a fixed container beats per-invocation pricing. If the template cannot answer
"can I run this on ECS?" with "yes, `make docker-build`", it is not a general-purpose starting point.

**Dev/prod parity has value even when you deploy to Vercel.** `next dev` with Turbopack is not
`next build` plus a Node server. Different bundler behaviour, no minification, different error
handling, different Server Component boundaries in edge cases. A locally runnable production
container catches "works in dev, breaks in prod" before a deploy does. The Playwright suite already
relies on this: it builds and serves the real production output rather than driving the dev server.

**Onboarding without a Node install.** `make up` runs the project. That matters for a designer, a
technical writer, or a CI job that only has Docker.

What it costs, stated up front: two Dockerfiles and a compose file to maintain, a pinned base image
that needs periodic bumping, and a build path that CI does not exercise on every pull request — so it
can rot quietly.

Alternatives considered:

| Option | Why not |
| --- | --- |
| Vercel only, no Docker | Smallest surface, and the template stops being portable. Also loses local production parity. |
| Docker without `output: 'standalone'` | The runner image needs the full `node_modules` — hundreds of megabytes, plus every build-time dependency's CVEs in the shipped image. |
| `output: 'export'` (static) | Would remove the server entirely, but the template uses `robots.ts`, `sitemap.ts`, `ImageResponse` routes and response headers from `next.config.ts`. Static export supports none of them. |
| Docker in a separate branch or a `docker/` extras folder | Keeps the main path clean and guarantees the extras go stale. Documentation for a path nobody runs is worse than no documentation. |
| **Standalone output plus a multi-stage Dockerfile** | Chosen. |

## Decision

We enable `output: 'standalone'` and ship a multi-stage production `Dockerfile`, alongside a separate
`Dockerfile.dev` and a development compose file — while keeping Vercel as the recommended deployment
path.

```ts title="next.config.ts"
// Emits a self-contained server bundle under `.next/standalone`, which is what
// the production Dockerfile copies. Harmless on Vercel, essential everywhere else.
output: 'standalone',
```

`next build` traces the modules the server actually imports and emits them, plus a minimal
`server.js`, into `.next/standalone`. The runner stage then needs **no `node_modules`, no package
manager and no `package.json`** — only Node and that directory.

```dockerfile title="Dockerfile (runner stage)"
FROM node:24.16.0-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

USER node

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
```

Supporting decisions, each with a reason:

- **The base image tag matches `.node-version`** (`node:24.16.0-slim`), so the container, CI and the
  developer machine run the identical runtime.
- **The runner runs as the non-root `node` user.**
- **`HOSTNAME=0.0.0.0`**, because Next binds to loopback by default and a container's loopback is
  unreachable from the host.
- **`CMD ["node", "server.js"]`, not `npm start`** — no npm process in the tree, so signals reach
  Node directly and `docker stop` shuts down cleanly.
- **The healthcheck uses the runtime's own `fetch`**, so the slim image needs neither `curl` nor
  `wget`.
- **`NEXT_PUBLIC_*` are build arguments**, because Next inlines them into the client bundle at build
  time. They cannot be supplied at run time, and a value in a public bundle is public by definition.
- **`Dockerfile.dev` is separate and runs as root**, because the compose file bind-mounts the host
  working tree and a fixed uid breaks for anyone whose host uid is not 1000.

## Consequences

### Positive

- **The template deploys anywhere.** ECS, Cloud Run, Azure Container Apps, Fly.io, Railway, Render,
  Kubernetes, or a VPS. `docker build`, `docker push`, run.
- **A much smaller image with a much smaller attack surface.** Build-time-only packages — TypeScript,
  ESLint, Vitest, Playwright, the whole dev dependency tree — never reach the runner stage, so their
  CVEs are not your container's CVEs.
- **Real production parity locally.** `docker run` gives you the minified, production-mode
  application on your machine, which catches a class of bug the dev server cannot.
- **Onboarding without a Node toolchain.** `make up` and the project is running.
- **No lock-in claim to defend.** "Can I move off Vercel later?" has a concrete, tested answer.
- **Free on Vercel.** The flag is inert there, so the primary path pays nothing for the option.
- **Layer caching makes rebuilds fast.** Manifests are copied before the source, so `npm ci` is only
  re-run when a dependency changes.

### Negative

- **Two deployment paths to keep working.** Vercel and the container can drift. The container path is
  not exercised on every pull request, so a regression can sit unnoticed until someone tries it.
- **Three files of container configuration to maintain.** `Dockerfile`, `Dockerfile.dev` and
  `docker-compose.yaml` — and the base image tag has to be bumped alongside `.node-version`, by hand,
  in three places.
- **`NEXT_PUBLIC_*` at build time is a genuine footgun.** It means one image per environment and a
  rebuild for a URL change. Everyone hits it once, and the failure mode — a site that works while
  advertising the wrong canonical URL — is silent.
- **You lose Vercel's platform features off-platform.** Image optimisation needs `sharp` and your own
  CPU; TLS needs a reverse proxy; preview URLs need your platform's equivalent; ISR across multiple
  instances needs a shared cache handler; `@vercel/analytics` and `@vercel/speed-insights` no-op.
  Each is solvable, and each is now your problem.
- **A second-guessing surface for readers.** Someone opening the repository sees Docker and asks
  whether they *should* be deploying that way. This ADR exists partly to answer that.
- **The dev image runs as root**, so generated files can end up root-owned on the host — mitigated by
  `make clean`, but it is a real papercut on Linux.
- **`output: 'standalone'` has sharp edges outside the trace.** Files read at runtime that Next did
  not trace (a config file, a content directory) are simply absent from the image. Monorepo setups
  additionally need `outputFileTracingRoot`.

### Neutral

- Vercel ignores the flag; there is no behavioural difference in the recommended path.
- The Playwright suite builds and serves production output regardless of Docker, so parity is
  validated on every CI run even though the container itself is not.
- No image is published to a registry by CI. The template builds locally on demand; publishing is
  left to whoever needs it.

## Revisit if

- CI starts building the image on every pull request — at that point it is worth adding a smoke test
  that boots the container and hits `/`, so the path stops being able to rot.
- Next.js changes the standalone contract, or ships a first-class container output.
- The project adopts a runtime-configuration approach (fetching public config at boot rather than
  inlining it), which would remove the build-argument constraint and allow one image per release
  instead of one per environment.
- The container path is provably unused after a year. Deleting it then is a fine outcome, and this
  record explains what is being given up.

## Opting out

**To drop containers entirely:** delete `Dockerfile`, `Dockerfile.dev`, `docker-compose.yaml`, the
Docker targets in the `Makefile` and `docs/guides/docker.md` (and its `nav:` entry). Then remove
`output: 'standalone'` from `next.config.ts` — nothing on Vercel depends on it.

**To keep containers but drop Vercel:** delete `vercel.json`, `deploy-preview.yml` and
`deploy-production.yml`, and remove `@vercel/analytics` and `@vercel/speed-insights` (they no-op
off-platform). Add a workflow that builds and pushes the image to your registry, and remember to set
`APP_ENV=production` at runtime so any environment-specific behaviour you add — indexing rules in
`robots.ts`, feature flags, log verbosity — sees the right value.
