# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Because this repository is a template rather than a published package, versioning
describes the template itself: a **major** release is a change that requires manual work
to adopt in a project already generated from it, a **minor** release adds capabilities,
and a **patch** release fixes something without changing how the template is used.

## [Unreleased]

Nothing yet.

## [1.0.0] - 2026-07-25

First public release of the template.

### Added

- **Application foundation** — Next.js 16.2.12 on the App Router with React Server
  Components, React 19.2.8, and TypeScript 5.9.3 in `strict` mode with
  `noUncheckedIndexedAccess`. Turbopack powers the dev server, and `output: 'standalone'`
  produces a self-contained server bundle for container deployments.
- **Design system** — Tailwind CSS 4.3.3 in CSS-first configuration (no
  `tailwind.config`), semantic color tokens driven by CSS custom properties, and dark
  mode through `next-themes` with no `dark:` variants anywhere in the codebase. Includes
  a small set of accessible UI primitives, layout components, `lucide-react` icons and a
  `cn()` helper built on `clsx` and `tailwind-merge`.
- **SEO** — typed Next.js Metadata, per-route canonical URLs, Open Graph and Twitter
  cards with dynamically generated OG images, JSON-LD structured data, plus generated
  `sitemap.xml` and `robots.txt` driven by `NEXT_PUBLIC_SITE_URL`.
- **Security headers** — a Content Security Policy,
  `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy` applied to every route from `src/lib/security-headers.ts`, along
  with helpers that sanitize `href` values and escape JSON-LD payloads.
- **Unit test suite** — Vitest 4 with Testing Library, jsdom and `user-event`, specs in
  `tests/` mirroring `src/`, and v8 coverage with a **100% floor** on statements, lines,
  branches and functions over `src/**`.
- **End-to-end tests** — Playwright running Chromium against a real production build,
  with specs in `tests/e2e/` covering rendering, navigation, theme persistence and SEO
  artifacts.
- **Docker and Makefile** — a multi-stage production `Dockerfile` running as a non-root
  user with a healthcheck, a `Dockerfile.dev` and `docker-compose.yaml` for containerized
  development, and a `Makefile` acting as the front door to every routine task
  (`make setup`, `make dev`, `make check`, `make test-coverage`, `make docs`,
  `make help`).
- **CI/CD on GitHub Actions** — a quality gate running format check, lint, typecheck,
  coverage and build, followed by the end-to-end suite; a Conventional Commits check on
  pull requests; CodeQL `security-and-quality` analysis; weekly grouped Dependabot
  updates for npm, Actions and Docker; and Vercel preview and production deployments.
- **Documentation** — a MkDocs Material site under `docs/`, built with `--strict` and
  published to GitHub Pages at
  <https://mauricioromagnollo.github.io/template-nextjs/>.
- **Commit and code hygiene** — husky hooks running lint-staged on `pre-commit` and
  commitlint on `commit-msg`, Prettier with `prettier-plugin-tailwindcss`, ESLint 9 flat
  config enforcing barrel imports via `no-restricted-imports`, Node 24.16.0 pinned in
  `.node-version`, and exact dependency versions through `save-exact=true`.

[unreleased]: https://github.com/mauricioromagnollo/template-nextjs/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mauricioromagnollo/template-nextjs/releases/tag/v1.0.0
