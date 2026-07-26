<div align="center">

# Next.js Template

**An opinionated, production-ready Next.js template — testing, linting, security headers, SEO, Docker and CI/CD already finished, so you can start on the part only you can write.**

[![CI](https://img.shields.io/github/actions/workflow/status/mauricioromagnollo/template-nextjs/ci.yml?branch=main&label=CI&logo=github)](https://github.com/mauricioromagnollo/template-nextjs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.8-087EA4?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](docs/guides/testing.md)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

[Documentation](https://mauricioromagnollo.github.io/template-nextjs/) ·
[Getting started](#-quick-start) ·
[Contributing](CONTRIBUTING.md) ·
[Changelog](CHANGELOG.md)

[![Use this template](https://img.shields.io/badge/Use%20this%20template-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mauricioromagnollo/template-nextjs/generate)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmauricioromagnollo%2Ftemplate-nextjs)

</div>

---

## Why this template

Starting a Next.js project takes fifteen minutes. Making it _production-ready_ takes two days, and
those two days look identical every time: wire a test runner to jsdom, decide where specs live, add
coverage thresholds, stop ESLint and Prettier from fighting, add commit hooks, write security
headers, build a metadata helper, generate a sitemap, containerise it, and assemble a CI pipeline
that runs all of it in a sensible order.

This repository is those two days, already spent — and the reasoning is written down. It is a
**foundation**, not a scaffold: nothing here is hidden behind an abstraction you cannot delete, and
every choice with a real trade-off is recorded as an
[architecture decision record](docs/decisions/index.md) so you can disagree with it on purpose
rather than by accident.

What makes it different from the usual starter:

- **A 100% coverage floor from the first commit.** Not a badge — a threshold in
  [`vitest.config.ts`](vitest.config.ts) on statements, lines, branches and functions. A module
  shipped without a spec does not lower a percentage; it turns CI red in the pull request that
  introduced it.
- **End-to-end tests that mean something.** Playwright builds the real production output and drives
  Chromium against it — not a dev server, not a mock.
- **Conventions enforced by tooling, not by agreement.** ESLint blocks deep imports, Prettier owns
  formatting, commitlint owns commit messages, husky runs both before the commit lands. Nothing
  depends on remembering.
- **The whole delivery path is wired.** GitHub Actions for the quality gate, CodeQL, Dependabot,
  Vercel preview and production deploys, a multi-stage Docker image, and a published MkDocs site.
- **Everything is pinned.** Exact dependency versions (`save-exact=true`), Node 24.16.0 in
  [`.node-version`](.node-version), a pinned MkDocs image. A fresh install today builds what CI
  built yesterday.

### What it is not

There is **no CMS, no i18n, no authentication and no database**. That is deliberate: each of those
brings an SDK, a routing model and a set of assumptions that are project-shaped. Adding one takes an
afternoon; removing an opinion you never asked for takes longer, and you never fully trust that you
got it all. The template stays a foundation for sites, blogs and landing pages, and gets out of the
way when your project needs to become something else.

---

## ✨ Features

### Framework and language

- **Next.js 16.2.12** on the App Router, with React Server Components by default and a Turbopack dev
  server.
- **React 19.2.8**, **TypeScript 5.9.3** in `strict` mode with `noUncheckedIndexedAccess` and
  `noImplicitOverride`, and the `@/*` path alias.
- `output: 'standalone'` — `next build` emits a self-contained server bundle, which is what the
  production image ships.
- A typed environment layer (`src/config/environment/`) that degrades to sane defaults instead of
  crashing a misconfigured preview deploy.

### Styling and UI

- **Tailwind CSS 4.3.3** in CSS-first configuration: no `tailwind.config` file, all design tokens in
  a single `@theme` block in [`src/styles/globals.css`](src/styles/globals.css).
- **Semantic colour tokens** (`background`, `muted-foreground`, `accent`…) — dark mode is a value
  swap, so there is not one `dark:` utility in the component layer.
- **Dark mode without the flash**, via `next-themes` and a class on `<html>`.
- Small, readable UI primitives: polymorphic `Button`, `Card`, `Container`, `SectionHeading`,
  `ThemeToggle`, plus `Header`, `Footer` and a config-driven `NavLinks`.
- Self-hosted `next/font` (Inter + JetBrains Mono), `lucide-react` icons, and a `cn()` helper built
  on `clsx` + `tailwind-merge`.
- Accessibility baked in: a skip link, visible focus rings, landmark labels and
  `prefers-reduced-motion` support.

### Testing

- **Vitest 4.1.10** with Testing Library, `user-event` and jsdom.
- **v8 coverage with a 100% floor** on statements, lines, branches and functions over `src/**`.
- **Playwright 1.62.0** driving Chromium against the production build, with traces on first retry.
- Specs live in `tests/`, mirroring `src/` one-to-one — `src/lib/seo.ts` → `tests/lib/seo.spec.ts`.

### Quality and conventions

- **ESLint 9.39.5** flat config (`core-web-vitals` + `typescript`) with a `no-restricted-imports`
  rule that makes every folder barrel the only legal import path.
- **Prettier 3.9.6** with `prettier-plugin-tailwindcss` for canonical class ordering.
- **husky + lint-staged** on `pre-commit`, **commitlint** on `commit-msg`.
- **Conventional Commits** with an explicit type allow-list, validated again on every pull request.
- `npm run check` / `make check` runs the exact gate CI runs, cheapest step first.

### DevOps and CI/CD

- **CI workflow** ([`ci.yml`](.github/workflows/ci.yml)): a `quality` job (format, lint, types,
  coverage, build) with Next.js build caching, an `e2e` job gated behind it with cached Playwright
  browsers, and a `commitlint` job on pull requests.
- **CodeQL** `security-and-quality` analysis on push, pull request and a weekly schedule.
- **Dependabot** for npm, GitHub Actions and Docker — weekly, grouped, with Conventional Commit
  prefixes.
- **Vercel deploys from CI**: preview on every push to `main`, production when a GitHub release is
  published, both from prebuilt artifacts.
- **Docker**: a multi-stage production image running as a non-root user with a `HEALTHCHECK`, plus
  `Dockerfile.dev` + `docker-compose.yaml` for containerised development.
- **A Makefile front door** — `make help` lists every routine task.

### SEO and security

- `buildMetadata()` produces canonical URLs, Open Graph and `summary_large_image` Twitter cards from
  one site config.
- Generated `opengraph-image` (1200×630), `icon` and `apple-icon` via `ImageResponse`.
- `sitemap.xml`, `robots.txt` and JSON-LD (`WebSite`), all driven by `NEXT_PUBLIC_SITE_URL`.
- Security headers applied to every route from [`next.config.ts`](next.config.ts): a
  Content-Security-Policy with no `unsafe-eval` in production, `Strict-Transport-Security`,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- `sanitizeHref()` drops `javascript:`, `data:` and protocol-relative URLs; `serializeJsonLd()`
  escapes `<` so a payload cannot close the script tag.

### Documentation

- A **MkDocs Material** site under [`docs/`](docs/), built with `--strict` and published to GitHub
  Pages: <https://mauricioromagnollo.github.io/template-nextjs/>.
- Four architecture decision records explaining the choices that have real trade-offs.
- Community files that are actually filled in: [`CONTRIBUTING.md`](CONTRIBUTING.md),
  [`SECURITY.md`](SECURITY.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md),
  [`SUPPORT.md`](.github/SUPPORT.md), issue forms and a pull request template.

---

## 🧰 Tech stack

| Category        | Technology                                                       | Version          |
| --------------- | ---------------------------------------------------------------- | ---------------- |
| Framework       | [Next.js](https://nextjs.org) (App Router)                       | 16.2.12          |
| UI library      | [React](https://react.dev) / React DOM                           | 19.2.8           |
| Language        | [TypeScript](https://www.typescriptlang.org) (`strict`)          | 5.9.3            |
| Runtime         | [Node.js](https://nodejs.org) (pinned in `.node-version`)        | 24.16.0          |
| Styling         | [Tailwind CSS](https://tailwindcss.com) + `@tailwindcss/postcss` | 4.3.3            |
| Class utilities | [clsx](https://github.com/lukeed/clsx) / `tailwind-merge`        | 2.1.1 / 3.6.0    |
| Icons           | [lucide-react](https://lucide.dev)                               | 1.27.0           |
| Theming         | [next-themes](https://github.com/pacocoursey/next-themes)        | 0.4.6            |
| Unit testing    | [Vitest](https://vitest.dev) + `@vitest/coverage-v8`             | 4.1.10           |
| DOM testing     | [Testing Library](https://testing-library.com) React / jest-dom  | 16.3.2 / 6.9.1   |
| User simulation | `@testing-library/user-event` and `jsdom`                        | 14.6.1 / 29.1.1  |
| E2E testing     | [Playwright](https://playwright.dev) (Chromium)                  | 1.62.0           |
| Linting         | [ESLint](https://eslint.org) + `eslint-config-next`              | 9.39.5 / 16.2.12 |
| Formatting      | [Prettier](https://prettier.io) + `prettier-plugin-tailwindcss`  | 3.9.6 / 0.8.1    |
| Git hooks       | [husky](https://typicode.github.io/husky) + `lint-staged`        | 9.1.7 / 17.2.0   |
| Commit linting  | `@commitlint/cli` + `@commitlint/config-conventional`            | 21.2.1 / 21.2.0  |
| Analytics       | `@vercel/analytics` and `@vercel/speed-insights`                 | 2.0.1 / 2.0.0    |
| Documentation   | [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)  | 9.5.49           |
| Containers      | Docker (`node:24.16.0-slim`, multi-stage) + Compose              | —                |
| CI/CD           | GitHub Actions, CodeQL, Dependabot, Vercel                       | —                |

Every npm dependency is pinned to an exact version (`save-exact=true` in [`.npmrc`](.npmrc)).

---

## 🚀 Quick start

**Requirements:** Node.js `24.16.0` (pinned in [`.node-version`](.node-version) and enforced by
`engines`), npm, and Docker only if you want the containerised workflow. Version managers such as
`fnm`, `nvm` and `asdf` read `.node-version` for you.

1. Click **[Use this template](https://github.com/mauricioromagnollo/template-nextjs/generate) →
   Create a new repository**.
2. Clone your new repository, bootstrap it and start the dev server:

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>

make setup   # cp .env.example .env + npm ci + playwright install --with-deps chromium
make dev     # http://localhost:3000
```

Without `make`:

```bash
npm ci
cp .env.example .env
npm run test:e2e:install   # once, and only if you plan to run the E2E suite
npm run dev
```

Before your first push, run the same gate CI runs:

```bash
make check   # format:check → lint → typecheck → test:coverage → build
```

> `make` with no arguments prints the full menu of targets.

---

## 📁 Project structure

```text
template-nextjs/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Quality gate + E2E + commitlint
│   │   ├── codeql.yml             # Static security analysis (JS/TS)
│   │   ├── deploy-preview.yml     # Vercel preview deploy on push to main
│   │   ├── deploy-production.yml  # Vercel production deploy on published release
│   │   └── publish-docs.yml       # mkdocs build --strict → GitHub Pages
│   ├── ISSUE_TEMPLATE/            # Bug report, feature request and question forms
│   ├── CODEOWNERS                 # Default reviewer for every path
│   ├── FUNDING.yml                # Sponsor button
│   ├── SUPPORT.md                 # Where to ask for help
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml             # Weekly npm, Actions and Docker updates
│
├── .husky/                        # pre-commit (lint-staged), commit-msg (commitlint)
│
├── docs/                          # MkDocs Material documentation site
│   ├── getting-started/           # Installation, project structure, configuration
│   ├── architecture/              # Conventions, styling, SEO, security
│   ├── guides/                    # Development, testing, Docker, deployment, CI/CD, docs
│   ├── decisions/                 # Architecture decision records
│   ├── reference/                 # Commands, environment variables
│   ├── index.md
│   └── requirements.txt           # Pinned MkDocs toolchain
│
├── public/                        # Served verbatim at the site root
├── scripts/
│   └── clear-all.sh               # `make clean` — removes every generated artifact
│
├── src/
│   ├── app/                       # App Router — Server Components by default
│   │   ├── layout.tsx             # <html>, fonts, providers, header/footer, JSON-LD, analytics
│   │   ├── page.tsx               # The landing page (delete it, keep the foundation)
│   │   ├── not-found.tsx          # 404
│   │   ├── error.tsx              # Route-level error boundary ('use client')
│   │   ├── robots.ts              # /robots.txt
│   │   ├── sitemap.ts             # /sitemap.xml
│   │   ├── icon.tsx               # 32×32 favicon via ImageResponse
│   │   ├── apple-icon.tsx         # 180×180 touch icon
│   │   └── opengraph-image.tsx    # 1200×630 social card
│   │
│   ├── components/
│   │   ├── providers.tsx          # The single client boundary (next-themes)
│   │   ├── layout/                # header, footer, nav-links + barrel
│   │   └── ui/                    # button, card, container, section-heading, theme-toggle
│   │
│   ├── config/
│   │   ├── environment/           # Typed, validated process.env access
│   │   └── site/                  # site-config.ts — name, URL, navigation, social links
│   │
│   ├── lib/                       # Pure helpers: cn, seo, og, sanitize, security-headers
│   └── styles/
│       └── globals.css            # Tailwind import, @theme tokens, dark variant, base layer
│
├── tests/                         # Every spec, mirroring src/ (tests/e2e/ holds Playwright specs)
│
├── Dockerfile                     # Multi-stage production image (standalone output, non-root)
├── Dockerfile.dev                 # Development image used by compose
├── docker-compose.yaml            # Dev stack with bind mount and hot reload
├── Makefile                       # The front door — `make help`
├── mkdocs.yml                     # Documentation site configuration
├── next.config.ts                 # standalone output, image formats, security headers
├── vitest.config.ts               # jsdom, tests/ include, v8 coverage at 100%
├── playwright.config.ts           # Chromium E2E against the production build
├── eslint.config.mjs              # Flat config + barrel-import rule
├── commitlint.config.mjs          # Conventional Commits, explicit type allow-list
└── vercel.json                    # Marks the project as a Next.js framework project
```

Full annotated tour: [Project Structure](docs/getting-started/project-structure.md).

---

## 🛠️ Available commands

### npm scripts

| Script                  | What it does                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Dev server with Turbopack on <http://localhost:3000>                     |
| `npm run build`         | Production build (also emits `.next/standalone`)                         |
| `npm start`             | Serves a previously built production bundle                              |
| `npm run lint`          | ESLint over the repository (`lint:fix` to autofix)                       |
| `npm run typecheck`     | `tsc --noEmit`                                                           |
| `npm run format`        | Prettier write (`format:check` to verify only)                           |
| `npm run test:unit`     | Vitest, single run                                                       |
| `npm run test:coverage` | Vitest with coverage, enforcing the 100% thresholds                      |
| `npm run test:e2e`      | Playwright suite (`test:e2e:install` downloads Chromium first)           |
| `npm run check`         | `format:check` + `lint` + `typecheck` + `test:coverage` — the local gate |

### Makefile targets

| Target               | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `make help`          | Default target — lists every command                                |
| `make setup`         | Bootstrap a fresh clone: `.env`, `npm ci`, Playwright browsers      |
| `make dev`           | Start the dev server                                                |
| `make check`         | Format, lint, types, coverage **and** build                         |
| `make test-coverage` | Unit tests with the coverage report                                 |
| `make test-e2e`      | Playwright end-to-end suite                                         |
| `make up` / `down`   | Start / stop the Docker development stack                           |
| `make docker-build`  | Build the production image                                          |
| `make docs`          | Serve the documentation with live reload on <http://localhost:8000> |
| `make clean`         | Delete every generated artifact                                     |

Complete list of both, with recipes: [Command reference](docs/reference/commands.md).

---

## ✅ Testing

Two suites, two runners, one rule: nothing merges without both green.

| Suite            | Runner                          | Location                  | Command             |
| ---------------- | ------------------------------- | ------------------------- | ------------------- |
| Unit / component | Vitest + Testing Library, jsdom | `tests/**` (minus `e2e/`) | `npm run test:unit` |
| End-to-end       | Playwright, Chromium            | `tests/e2e/**`            | `npm run test:e2e`  |

```bash
npm run test:watch     # watch mode while developing
npm run test:unit      # single run — the fastest full pass
npm run test:coverage  # single run + coverage report + thresholds
npm run test:e2e       # builds the app, serves it, drives Chromium
```

**Specs are not colocated.** `src/` holds what ships, `tests/` holds what proves it works, in a tree
that mirrors `src/` exactly — an asymmetry between the two is a question a reviewer can ask just by
reading the file list.

The coverage floor in [`vitest.config.ts`](vitest.config.ts) is **100%** on statements, lines,
branches and functions. Only barrels (`src/**/index.ts`), declaration files and type-only modules
are excluded, each for a technical reason rather than a convenient one. 100 is the only number that
does not decay: at 85, the untested 15% is nobody's problem; at 100, a module without a spec turns
CI red immediately. The full argument — including how to lower it on purpose — is in
[ADR 0001](docs/decisions/0001-100-percent-coverage-threshold.md).

Coverage reports are written to `coverage/` (text, HTML and lcov) and uploaded as a CI artifact even
when the run fails. More in the [Testing guide](docs/guides/testing.md).

---

## 🚢 Deployment

### Vercel

The fastest path is the **Deploy with Vercel** button at the top of this README, or importing the
repository from the Vercel dashboard.

To deploy from CI instead — so production only ever ships code that already passed the `CI` workflow
— run `vercel link` once locally and add three repository secrets under
**Settings → Secrets and variables → Actions**:

| Secret              | Where it comes from                                 |
| ------------------- | --------------------------------------------------- |
| `VERCEL_TOKEN`      | <https://vercel.com/account/tokens>                 |
| `VERCEL_ORG_ID`     | `orgId` in the generated `.vercel/project.json`     |
| `VERCEL_PROJECT_ID` | `projectId` in the generated `.vercel/project.json` |

With those in place, [`deploy-preview.yml`](.github/workflows/deploy-preview.yml) publishes a
preview URL on every push to `main`, and
[`deploy-production.yml`](.github/workflows/deploy-production.yml) ships to production when a GitHub
release is published. Both build with `vercel build` and upload prebuilt artifacts. Set
`NEXT_PUBLIC_SITE_URL` to your real domain in the Vercel project settings — canonical URLs, the
sitemap, `robots.txt` and Open Graph tags all read from it.

### Docker

The production image packages the Next.js standalone output, runs as a non-root user and ships with
a healthcheck, so the same artifact runs on Fly, ECS, Cloud Run or your own box.

```bash
make docker-build \
  NEXT_PUBLIC_SITE_URL=https://example.com \
  NEXT_PUBLIC_SITE_NAME="My Site"

docker run --rm -p 3000:3000 template-nextjs:latest
```

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so they are build arguments
— changing one means rebuilding the image. For containerised development instead:

```bash
make up      # build and start the dev stack in the background
make logs    # follow the dev server output
make down    # stop and remove
```

See the [Deployment](docs/guides/deployment.md) and [Docker](docs/guides/docker.md) guides,
including a go-live checklist.

---

## 🎨 Customizing the template

Everything that makes this repository _this_ project lives in a handful of files. Work through the
list once and the template is yours:

- [ ] **[`src/config/site/site-config.ts`](src/config/site/site-config.ts)** — name, description,
      locale, author, social links and the header navigation. Everything else reads from here.
- [ ] **[`src/styles/globals.css`](src/styles/globals.css)** — the `@theme` block and its `.dark`
      counterpart. Swap the accent triplet and the whole UI follows. The literal hex values in
      `src/app/icon.tsx`, `apple-icon.tsx` and `opengraph-image.tsx` are separate on purpose (Satori
      resolves neither CSS variables nor `oklch`).
- [ ] **[`package.json`](package.json)** — `name`, `description`, `repository`, `bugs`, `homepage`
      and `author`.
- [ ] **[`LICENSE`](LICENSE)** — keep MIT and put your own name and year in the copyright line, or
      replace it entirely.
- [ ] **[`.github/CODEOWNERS`](.github/CODEOWNERS)** and [`.github/FUNDING.yml`](.github/FUNDING.yml)
      — your handle, your team, or delete both files.
- [ ] **[`mkdocs.yml`](mkdocs.yml)** — `site_name`, `site_url`, `repo_url`, `copyright` and the
      social links; then prune [`docs/`](docs/) down to what your project actually needs.
- [ ] **[`.env.example`](.env.example)** — `NEXT_PUBLIC_SITE_NAME` and `NEXT_PUBLIC_SITE_URL` are the
      two that matter; mirror any new variable here and in `src/config/environment/environment.ts`.
- [ ] **Replace the landing page** — `src/app/page.tsx` is a demo. Delete it and keep the layout, the
      primitives and the plumbing.
- [ ] Optional: [`CITATION.cff`](CITATION.cff), [`CHANGELOG.md`](CHANGELOG.md), and the
      `mauricioromagnollo` references in [`SECURITY.md`](SECURITY.md) and
      [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Step-by-step version: [Configuration](docs/getting-started/configuration.md).

---

## 📚 Documentation

Published at **<https://mauricioromagnollo.github.io/template-nextjs/>** and written in
[`docs/`](docs/).

| Section                                                          | What it covers                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| [Installation](docs/getting-started/installation.md)             | Prerequisites, local setup, Docker setup, troubleshooting  |
| [Project Structure](docs/getting-started/project-structure.md)   | Every directory and configuration file, and why it exists  |
| [Configuration](docs/getting-started/configuration.md)           | Making the template yours: name, colours, domain, env vars |
| [Architecture Overview](docs/architecture/index.md)              | How the layers relate and what may import what             |
| [Conventions](docs/architecture/conventions.md)                  | Naming, barrels, Server Components, code standards         |
| [Styling](docs/architecture/styling.md)                          | Design tokens, dark mode, the Tailwind v4 setup            |
| [SEO & Metadata](docs/architecture/seo.md)                       | `buildMetadata()`, OG images, sitemap, robots, JSON-LD     |
| [Security](docs/architecture/security.md)                        | CSP and headers, sanitisation, pinned dependencies         |
| [Development](docs/guides/development.md)                        | The day-to-day loop, commit rules, git hooks               |
| [Testing](docs/guides/testing.md)                                | Both suites, the 100% floor, what to test and how          |
| [Docker](docs/guides/docker.md)                                  | The development stack and the production image             |
| [Deployment](docs/guides/deployment.md)                          | Vercel, other platforms, the go-live checklist             |
| [CI/CD](docs/guides/ci-cd.md)                                    | Every workflow, job and required secret                    |
| [Documentation](docs/guides/documentation.md)                    | Writing and previewing these pages                         |
| [Decisions](docs/decisions/index.md)                             | Architecture decision records, with an ADR template        |
| [Commands](docs/reference/commands.md)                           | Every npm script and Makefile target                       |
| [Environment Variables](docs/reference/environment-variables.md) | Every variable, its default and where it is read           |

Preview the site locally with `make docs`, and verify the strict build with `make docs-build` before
pushing documentation changes.

---

## 🤝 Contributing

Contributions are welcome — bug reports, documentation fixes and changes that make the foundation
sturdier without widening its scope. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first: it covers what
belongs in the template, the development setup, the Conventional Commits rules, the 100% coverage
requirement and the pull request checklist. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).

Need help rather than a change? Start with [`SUPPORT.md`](.github/SUPPORT.md). Found a
vulnerability? Follow the private process in [`SECURITY.md`](SECURITY.md) instead of opening an
issue.

---

## 🗺️ Roadmap

The scope is deliberately closed: this template is finished when it stays current, not when it grows
features. The ongoing work is therefore narrow — keep the stack on current releases through
Dependabot, keep coverage at 100%, keep the documentation matching the code, and record any new
trade-off as an ADR. Requests that would add a CMS, i18n, authentication or a database are out of
scope by design; see [Scope](CONTRIBUTING.md#scope-what-belongs-here) in the contributing guide.
Released changes are tracked in [`CHANGELOG.md`](CHANGELOG.md).

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) and [Vercel](https://vercel.com), for the framework and the platform
  this template targets.
- [Tailwind CSS](https://tailwindcss.com), whose v4 CSS-first configuration made the design token
  layer possible.
- [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) by
  [@timlrx](https://github.com/timlrx), a long-standing reference for what a well-documented Next.js
  template looks like.
- [Vitest](https://vitest.dev), [Playwright](https://playwright.dev),
  [Testing Library](https://testing-library.com) and
  [MkDocs Material](https://squidfunk.github.io/mkdocs-material/), which do the heavy lifting behind
  the testing and documentation setup.

---

## 📄 License

Released under the [MIT License](LICENSE) — © 2026 Maurício Romagnollo. Use it commercially, modify
it, keep the copyright notice.

<div align="center">

Built by [@mauricioromagnollo](https://github.com/mauricioromagnollo) · If it saved you those two
days, a ⭐ is appreciated.

</div>
