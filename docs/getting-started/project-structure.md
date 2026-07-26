# Project Structure

A tour of every directory and every configuration file in the repository, and why each one exists.

## The whole tree

```text
template-nextjs/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Quality gate: format, lint, types, unit+coverage, build, E2E, commitlint
│   │   ├── codeql.yml             # GitHub's static security analysis for JS/TS
│   │   ├── deploy-preview.yml     # Vercel preview deploy on every push to main
│   │   ├── deploy-production.yml  # Vercel production deploy when a GitHub release is published
│   │   └── publish-docs.yml       # Builds this site with `mkdocs build --strict` and publishes to Pages
│   ├── ISSUE_TEMPLATE/            # Bug report, feature request, question — plus config.yml
│   ├── dependabot.yml             # Weekly npm + GitHub Actions update PRs
│   ├── CODEOWNERS                 # Default reviewer for every path
│   ├── FUNDING.yml                # Sponsor links on the repo sidebar
│   ├── PULL_REQUEST_TEMPLATE.md   # Checklist prefilled into every pull request
│   └── SUPPORT.md                 # Where to ask questions instead of opening an issue
│
├── .husky/                        # Git hooks: pre-commit (lint-staged) and commit-msg (commitlint)
│
├── docs/                          # This documentation site (MkDocs Material)
│   ├── getting-started/
│   ├── architecture/
│   ├── guides/
│   ├── decisions/                 # Architecture decision records, plus template.md
│   ├── reference/
│   ├── index.md
│   └── requirements.txt           # Pinned mkdocs-material + pymdown-extensions, read by publish-docs.yml
│
├── public/                        # Served verbatim at the site root (no processing, no hashing)
│
├── scripts/
│   └── clear-all.sh               # `make clean` — deletes every git-ignored build artifact
│
├── src/                           # Application code — see the breakdown below
│
├── tests/                         # Every spec in the project — mirrors src/
│
├── .dockerignore                  # Keeps node_modules/.next/.git out of the build context
├── .editorconfig                  # Whitespace rules every editor understands
├── .env.example                   # Committed reference for .env (which is git-ignored)
├── .gitignore
├── .node-version                  # 24.16.0 — read by fnm/nvm/asdf and CI; both Dockerfiles pin the same tag
├── .npmrc                         # save-exact=true — new dependencies are pinned, never "^1.2.3"
├── .prettierignore                # docs/, mkdocs.yml, generated output and the lockfile are not formatted
├── .prettierrc                    # Single quotes, no semicolons, 100 columns, Tailwind class sorting
├── CHANGELOG.md                   # Keep a Changelog format, updated per release
├── CITATION.cff                   # Machine-readable citation metadata for the repository
├── CODE_OF_CONDUCT.md             # Contributor Covenant
├── commitlint.config.mjs          # Conventional Commits, with an explicit type allow-list
├── CONTRIBUTING.md                # How to propose a change, and the gate it has to pass
├── docker-compose.yaml            # Development stack (Dockerfile.dev + bind mount), service `app`
├── Dockerfile                     # Multi-stage production image
├── Dockerfile.dev                 # Development image used by compose
├── eslint.config.mjs              # ESLint 9 flat config + the barrel-import rule
├── LICENSE                        # MIT
├── Makefile                       # The front door: `make help` lists everything
├── mkdocs.yml                     # Documentation site configuration
├── next.config.ts                 # standalone output, image formats, security headers
├── package.json
├── package-lock.json
├── playwright.config.ts           # Chromium E2E, with a webServer that builds and serves the app
├── postcss.config.mjs             # Loads @tailwindcss/postcss — the whole Tailwind v4 build
├── README.md
├── SECURITY.md                    # Supported versions and how to report a vulnerability
├── tsconfig.json                  # strict + noUncheckedIndexedAccess, `@/*` path alias
├── vercel.json                    # Marks the project as a Next.js framework project
└── vitest.config.ts               # jsdom, tests/ include, v8 coverage with 100% thresholds
```

---

## `src/` — application code

```text
src/
├── app/                        # App Router. Everything here is a Server Component by default.
│   ├── layout.tsx              # Root layout: <html>, fonts, <Providers>, header/footer, analytics
│   ├── page.tsx                # The landing page
│   ├── not-found.tsx           # 404 — rendered for unmatched routes and notFound()
│   ├── error.tsx               # Route-level error boundary ('use client', by framework contract)
│   ├── robots.ts               # Generates /robots.txt from the site config
│   ├── sitemap.ts              # Generates /sitemap.xml from its STATIC_ROUTES list
│   ├── icon.tsx                # Favicon generated at build time with ImageResponse
│   ├── apple-icon.tsx          # 180×180 touch icon, same technique
│   └── opengraph-image.tsx     # 1200×630 social card, same technique
│
├── components/
│   ├── providers.tsx           # Client boundary: next-themes ThemeProvider (and anything like it)
│   ├── layout/                 # Page furniture
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── nav-links.tsx
│   │   └── index.ts            # Barrel — the only import path other modules may use
│   └── ui/                     # Presentational primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── container.tsx
│       ├── section-heading.tsx
│       ├── theme-toggle.tsx    # 'use client' — needs useTheme()
│       └── index.ts
│
├── config/
│   ├── environment/
│   │   ├── app-env.ts          # The APP_ENV union type and its guard
│   │   ├── environment.ts      # Reads and validates process.env into a typed object
│   │   └── index.ts
│   └── site/
│       ├── site-config.ts      # Name, description, URL, navigation, social links
│       └── index.ts
│
├── lib/
│   ├── cn.ts                   # clsx + tailwind-merge — the class composer
│   ├── seo.ts                  # buildMetadata(), absoluteUrl() and buildWebSiteJsonLd()
│   ├── sanitize.ts             # isSafeHref / sanitizeHref / serializeJsonLd
│   ├── security-headers.ts     # buildSecurityHeaders(), consumed by next.config.ts
│   ├── og.ts                   # OG_SIZE, OG_CONTENT_TYPE and truncateOgTitle() for the ImageResponse routes
│   └── index.ts
│
└── styles/
    └── globals.css             # Tailwind import, @custom-variant dark, @theme tokens, base layer
```

### How the layers relate

| Layer | May import from | Must never import |
| --- | --- | --- |
| `app/` | `components/`, `config/`, `lib/` | — |
| `components/` | `components/ui`, `config/`, `lib/` | `app/` |
| `lib/` | `config/` | `app/`, `components/` |
| `config/` | nothing outside `config/` | everything else |

`config/` is the bottom of the stack — `site-config.ts` reads the environment module and nothing
else. `lib/` sits just above it: pure functions and no React, but `seo.ts` does read `siteConfig`,
which is what lets every metadata helper derive from one place.

`security-headers.ts` is the one module with no imports at all, which is why `next.config.ts` can
call `buildSecurityHeaders()` at config-evaluation time without pulling the application graph into
the Next.js config.

!!! note "Barrels are the public surface"

    Every folder listed with an `index.ts` re-exports its public API, and ESLint **fails the build**
    on a deep import such as `@/lib/seo`. Use `@/lib`. The rationale, and how to switch it off, is in
    [ADR 0003](../decisions/0003-barrel-imports-enforced-by-eslint.md).

---

## `tests/` — every spec in the project

```text
tests/
├── setup-tests.ts              # Loaded by Vitest before each file: jest-dom matchers, cleanup, mocks
├── globals.d.ts                # Ambient types for the Vitest globals used across the suite
├── helpers/
│   └── dom-stubs.ts            # Shared jsdom stubs (matchMedia and friends)
├── app/                        # Mirrors src/app
├── components/
│   ├── layout/
│   └── ui/
├── config/
├── lib/
└── e2e/                        # Playwright specs — excluded from the Vitest run
```

Specs are **not** colocated next to the code they test. `src/` contains what ships; `tests/` contains
what proves it works, in a directory structure that mirrors it one-to-one. A file at
`src/lib/seo.ts` is tested by `tests/lib/seo.spec.ts`.

`vitest.config.ts` enforces the split at both ends:

```ts title="vitest.config.ts (excerpt)"
include: ['tests/**/*.{test,spec}.{ts,tsx}'],
// E2E specs run under Playwright, not Vitest.
exclude: ['tests/e2e/**', 'node_modules/**'],
```

The reasoning, and the coverage rules that go with it, are in the [Testing guide](../guides/testing.md).

---

## Configuration files, one by one

### Runtime and build

`next.config.ts`
: Three things. `output: 'standalone'` makes `next build` emit a self-contained server under
`.next/standalone` (what the Dockerfile copies). `images.formats` prefers AVIF then WebP, and
`images.remotePatterns` is an empty allow-list you extend before loading images from another host.
`headers()` applies `buildSecurityHeaders()` to every route.

`postcss.config.mjs`
: Loads `@tailwindcss/postcss`. That single plugin *is* the Tailwind v4 build — there is no
`tailwind.config.js`, and there is not supposed to be. See [Styling](../architecture/styling.md).

`tsconfig.json`
: `strict` plus `noUncheckedIndexedAccess` (indexed access yields `T | undefined`) and
`noImplicitOverride`. `moduleResolution: 'bundler'`, `noEmit` (Next does the emitting), and the
`@/*` → `./src/*` path alias.

`vercel.json`
: Declares the framework preset. Keeps Vercel from guessing when the repository grows extra
top-level folders like `docs/`.

### Quality

`eslint.config.mjs`
: Flat config, composed from `eslint-config-next/core-web-vitals` and
`eslint-config-next/typescript`, plus a `no-restricted-imports` block that blocks deep imports into
`@/lib/*`, `@/components/ui/*`, `@/components/layout/*` and `@/config/*/*`. Specs and config files
are exempted — they import the module under test directly by design. The `ignores` block replaces the
deprecated `.eslintignore` and covers build output, `coverage/`, `site/` (MkDocs) and the Playwright
report directories.

`.prettierrc`
: `singleQuote`, `semi: false`, `printWidth: 100`, `trailingComma: 'es5'`, and
`prettier-plugin-tailwindcss` to keep utility classes in canonical order. Formatting is not a
matter of taste here — `format:check` is the first step of CI.

`.prettierignore`
: Excludes generated output, the lockfile, and `docs/` + `mkdocs.yml`. The documentation is written
for MkDocs, and Prettier's Markdown reflowing fights with it.

`commitlint.config.mjs`
: `@commitlint/config-conventional` with an explicit `type-enum`, a 100-character header limit, and
`subject-case` rules. Enforced locally by the `commit-msg` hook and in CI by the `commitlint` job.

`.editorconfig`
: Two-space indentation, LF endings, UTF-8, trailing whitespace trimmed. Tabs for Markdown and the
`Makefile`, because both require them.

### Testing

`vitest.config.ts`
: jsdom environment, `globals: true`, `tests/setup-tests.ts` as the setup file, and v8 coverage
including `src/**/*.{ts,tsx}`. Barrels (`src/**/index.ts`) and type-only modules are excluded — they
contain nothing executable, and v8 reports an empty denominator as 0%. Thresholds are 100% on all
four metrics.

`playwright.config.ts`
: `testDir: './tests/e2e'`, Chromium only, `fullyParallel`, `forbidOnly` and two retries on CI. The
`webServer` block builds and serves the production output locally, starts only the server on CI
(where the workflow already built), and steps aside entirely when `PLAYWRIGHT_BASE_URL` points at a
deployed environment.

### Environment and tooling

`.node-version`
: `24.16.0`. Read by version managers and by every `actions/setup-node` step
(`node-version-file: .node-version`), so CI cannot drift from your machine. The two Dockerfiles pin
`node:24.16.0-slim` in their `FROM` lines — a `FROM` cannot read a file, so bump those together with
this one.

`.npmrc`
: `save-exact=true`. `npm install <pkg>` writes `"1.2.3"`, not `"^1.2.3"`. Every dependency in
`package.json` is pinned — a transitive-range surprise is not something a template should ship. See
[Security](../architecture/security.md#pinned-dependencies).

`Makefile`
: The front door. `make` with no arguments prints the help. Targets wrap npm scripts and Docker
Compose so there is exactly one name per task regardless of what runs underneath. Full list in the
[command reference](../reference/commands.md).

### Containers

`Dockerfile`
: Two stages. The builder installs with `npm ci`, receives `NEXT_PUBLIC_*` as build arguments and
runs `next build`. The runner copies `public/`, `.next/standalone` and `.next/static`, runs as the
non-root `node` user, and starts `node server.js`. A `HEALTHCHECK` uses the runtime's own `fetch`, so
the slim image needs neither `curl` nor `wget`.

`Dockerfile.dev`
: Single stage, `NODE_ENV=development`, runs `npm run dev`. It deliberately runs as root because the
compose file bind-mounts the host working tree — a fixed uid would break for anyone whose host uid is
not 1000.

`docker-compose.yaml`
: The development stack: builds `Dockerfile.dev`, bind-mounts the project over `/app`, keeps
`node_modules` in an anonymous volume, reads `.env`, and publishes `PORT`.

---

## Where things go

| I am adding… | It goes in | And its spec goes in |
| --- | --- | --- |
| A page or route | `src/app/<segment>/page.tsx` | `tests/app/<segment>/page.spec.tsx` |
| A reusable primitive | `src/components/ui/<name>.tsx` + export from `index.ts` | `tests/components/ui/<name>.spec.tsx` |
| Header/footer/nav furniture | `src/components/layout/` | `tests/components/layout/` |
| A pure helper | `src/lib/<name>.ts` + export from `index.ts` | `tests/lib/<name>.spec.ts` |
| Description, navigation, social links | `src/config/site/site-config.ts` | `tests/config/` |
| A new environment variable | `src/config/environment/environment.ts` **and** `.env.example` | `tests/config/` |
| A user-visible flow worth guarding | — | `tests/e2e/<flow>.spec.ts` |
| A documentation page | `docs/<section>/<name>.md` | add it to `nav:` in `mkdocs.yml` |

!!! warning "Every new file under `src/` needs a spec"

    Coverage thresholds are 100%. A module without a spec does not lower the number — it fails the
    build. That is the point; see [ADR 0001](../decisions/0001-100-percent-coverage-threshold.md).
