# Next.js Template

An opinionated, production-ready [Next.js](https://nextjs.org) template for **sites, blogs and
landing pages** — with the boring, easy-to-postpone parts already done: testing, linting, type
safety, security headers, SEO, Docker and CI/CD.

It is a [GitHub template repository](https://github.com/mauricioromagnollo/template-nextjs). Click
**Use this template**, clone, run `make setup`, and start writing the parts that are actually
specific to your project.

---

## Why this exists

Starting a new Next.js project takes fifteen minutes. Making that project *production-ready* takes
two days, and those two days look identical every time: pick a test runner and wire it to jsdom,
decide where specs live, add coverage thresholds, configure ESLint and Prettier so they stop
fighting each other, add commit hooks, write security headers, build a metadata helper, add a
sitemap, containerise it, and set up a CI pipeline that runs all of it in a sensible order.

This template is those two days, already spent — with the reasoning written down. Every non-obvious
choice is documented, and the ones with real trade-offs are recorded as
[architecture decision records](decisions/index.md) so you can disagree with them on purpose rather
than by accident.

!!! note "It is a starting point, not a framework"

    Nothing here is hidden behind an abstraction you cannot delete. If you dislike the 100% coverage
    floor, change one number in `vitest.config.ts`. If you dislike barrel imports, delete one ESLint
    rule. Each ADR ends by telling you exactly what to remove.

---

## What is included

<div class="grid cards" markdown>

-   :material-web: **Next.js 16 + React 19**

    App Router, React Server Components, Turbopack dev server, and `output: 'standalone'` so the app
    ships as a self-contained bundle.

-   :material-language-typescript: **TypeScript 5.9, strict**

    `strict` plus `noUncheckedIndexedAccess` and `noImplicitOverride`. Array access is typed as
    possibly `undefined`, because it is.

-   :material-palette: **Tailwind CSS 4, CSS-first**

    No `tailwind.config.js`. Design tokens live in `@theme` inside `src/styles/globals.css`, and
    dark mode works with **zero `dark:` classes** in components.

-   :material-test-tube: **Vitest 4 + Testing Library**

    jsdom environment, v8 coverage, and a **100% threshold** on statements, lines, branches and
    functions. Specs mirror `src/` under `tests/`.

-   :material-drama-masks: **Playwright 1.62**

    A Chromium end-to-end suite that builds and serves the real production output before it runs.

-   :material-shield-lock: **Security headers**

    Content-Security-Policy, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and
    `Permissions-Policy`, applied from `next.config.ts`.

-   :material-magnify: **SEO out of the box**

    A `buildMetadata()` helper, canonical URLs, Open Graph and Twitter cards, generated
    `opengraph-image`/`icon`, `sitemap.ts`, `robots.ts` and sanitised JSON-LD.

-   :material-package-variant-closed: **Docker + Makefile**

    A multi-stage production image, a development compose file, and a `make` front door for every
    workflow.

-   :material-source-branch: **Quality gates**

    ESLint 9 flat config, Prettier, husky + lint-staged, and commitlint enforcing Conventional
    Commits.

-   :material-rocket-launch: **CI/CD**

    GitHub Actions for CI, CodeQL, Vercel preview and production deploys, and this documentation
    site.

</div>

### What is *not* included

Deliberately. Adding these is easier than removing an opinion you did not ask for.

| Not included | Why |
| --- | --- |
| Internationalisation (i18n) | Routing, message catalogues and locale negotiation are project-shaped decisions. Next.js supports them natively when you need them. |
| A CMS integration | Every CMS brings its own SDK, preview mode and webhooks. The template stays content-agnostic. |
| A component library | The `ui/` folder ships five small primitives you can read in a minute and rewrite in five. |
| A database or ORM | This is a template for sites, blogs and landing pages. Most of them never touch one. |
| Authentication | Same reason. Nothing in the template blocks you from adding it. |

---

## Quick start

1.  On [the repository page](https://github.com/mauricioromagnollo/template-nextjs), click
    **Use this template** :material-arrow-right: **Create a new repository**.
2.  Clone your new repository and enter it.
3.  Run `make setup` — it installs dependencies, creates `.env` from `.env.example` and downloads the
    Playwright browser.
4.  Run `make dev` and open <http://localhost:3000>.

!!! note "Why not fork?"

    Forking works, but a repository created from a template starts with a clean history and no
    upstream link — which is what you want for a new project.

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>

make setup   # cp .env.example .env + npm ci + playwright install
make dev     # http://localhost:3000
```

Before your first commit, run the full local gate:

```bash
make check   # format:check + lint + typecheck + test:coverage + build
```

!!! tip "`make` with no arguments prints the menu"

    `make help` (the default target) lists every available command with a one-line description. See
    the [command reference](reference/commands.md) for the full table.

---

## Where to go next

| I want to… | Read |
| --- | --- |
| Get the project running locally or in Docker | [Installation](getting-started/installation.md) |
| Understand what every file in the repo does | [Project Structure](getting-started/project-structure.md) |
| Make the template *mine* — name, colours, domain | [Configuration](getting-started/configuration.md) |
| Understand how the app is layered | [Architecture Overview](architecture/index.md) |
| Write code that passes review on the first try | [Conventions](architecture/conventions.md) |
| Add or change colours, spacing, fonts | [Styling](architecture/styling.md) |
| Change page titles, Open Graph images, sitemap | [SEO & Metadata](architecture/seo.md) |
| Add an analytics script and not break the CSP | [Security](architecture/security.md) |
| Write tests that satisfy the coverage floor | [Testing](guides/testing.md) |
| Know my day-to-day loop and commit rules | [Development](guides/development.md) |
| Build and run the container | [Docker](guides/docker.md) |
| Ship it | [Deployment](guides/deployment.md) |
| Understand a red check on my pull request | [CI/CD](guides/ci-cd.md) |
| Edit these docs | [Documentation](guides/documentation.md) |
| Know *why* something is the way it is | [Decisions](decisions/index.md) |

---

## License

Released under the [MIT License](https://github.com/mauricioromagnollo/template-nextjs/blob/main/LICENSE).
Use it commercially, modify it, keep the copyright notice.
