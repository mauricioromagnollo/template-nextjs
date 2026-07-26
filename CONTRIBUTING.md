# Contributing

Thanks for taking the time to look into this. Every fix, test and typo correction
makes the template better for everyone who starts a project from it.

Before anything else, one thing worth stating clearly: **this repository is a
template, not an application.** It is the starting point somebody copies to build a
marketing site, a blog or a landing page. Nothing here is a finished product, and
nothing here should be built for a single site's needs.

That distinction decides almost every question about what belongs in this repository,
so it is worth keeping in mind while reading the rest of this document.

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Table of contents

- [Scope: what belongs here](#scope-what-belongs-here)
- [Before you start](#before-you-start)
- [Development setup](#development-setup)
- [Workflow](#workflow)
- [Commits](#commits)
- [Before opening the pull request](#before-opening-the-pull-request)
- [The 100% coverage rule](#the-100-coverage-rule)
- [Code standards](#code-standards)
- [Tests](#tests)
- [Documentation](#documentation)
- [Review](#review)
- [License](#license)

---

## Scope: what belongs here

The guiding principle:

> **Everything that lands here is paid for by every project that uses the template.**

Every dependency added is a dependency thousands of `npm ci` runs have to download,
audit and eventually upgrade. Every abstraction added is an abstraction someone has to
read before they can delete it. Every clever pattern is a pattern someone has to
understand at 2 a.m. when their build breaks. A template earns its keep by being small
and boring, not by being complete.

So the bar for adding dependencies or complexity here is deliberately high. It is not
personal, and a rejected idea is not a bad idea — it is often just an idea that belongs
in a project built from the template rather than in the template itself.

### Welcome

- **Bug fixes** in the template itself — anything that behaves differently from what
  the docs promise, or that breaks on a supported platform.
- **Accessibility** — keyboard traps, missing accessible names, contrast failures,
  focus order, screen reader regressions, motion preferences. These are bugs, and they
  are propagated to every site built from the template.
- **Performance** — smaller bundles, fewer client components, better Core Web Vitals,
  removing work from the render path. Bring a before/after number.
- **Tooling and CI improvements** — faster, quieter or more correct checks; better
  caching; safer workflow permissions; clearer error messages.
- **Tests** — filling gaps, replacing brittle assertions, making failures easier to
  diagnose.
- **Documentation** — the `docs/` site, code comments that explain _why_, examples
  that are wrong or out of date.
- **Dependency updates** — especially security patches. Dependabot handles the routine
  batches; manual pull requests are welcome for majors that need a migration.

### Not welcome

- **Product features for a specific site.** A newsletter form, a pricing table, a
  contact form, a comment widget, a specific CMS integration. The template is the
  foundation; these belong in the house built on top of it. If it only makes sense for
  one kind of site, it does not go in.
- **Heavy libraries added on personal preference.** A state manager, an animation
  framework, a component library, a data-fetching layer, a form library. If a project
  needs one, the project installs one. Adding it here forces the choice on everyone and
  taxes every install. Exceptions need a concrete problem that the current stack cannot
  solve and a discussion in an issue first.
- **Visual identity changes without discussion.** Colors, typography, spacing scale
  and the overall look are deliberate. Proposals are fine — open an issue with a
  rationale and, ideally, a screenshot. Unannounced restyling in a pull request is not.
- **Broad refactors without behavioral motivation.** "Reorganized the folders",
  "extracted a helper", "switched to a different pattern" — with no bug fixed, no
  measurement improved and no rule enforced. These are expensive to review, hard to
  verify and tend to encode one person's taste. If a refactor unblocks a fix or removes
  a real hazard, say so in the description and the calculus changes.
- **Adding i18n, a CMS, a database or authentication.** These are explicit non-goals.
  The template stays backend-free by design; every one of them is a fork's decision, not
  the template's.

When in doubt, ask in an issue. It costs a few minutes and can save an afternoon of
work that ends up closed.

---

## Before you start

**For anything non-trivial, open an issue first.** Not for a typo or a broken link —
just send those. But for a behavior change, a new dependency, a workflow change or
anything that touches more than a few files, an issue lets us agree on the approach
before you spend the time.

Pick the right template from
[the issue chooser](https://github.com/mauricioromagnollo/template-nextjs/issues/new/choose):

- [`bug_report.yml`](.github/ISSUE_TEMPLATE/bug_report.yml) — something in the template
  is broken. Include your OS, Node version and reproduction steps.
- [`feature_request.yml`](.github/ISSUE_TEMPLATE/feature_request.yml) — a proposal.
  Lead with the problem, not the solution, and explain why it belongs in a template
  rather than in a project built from it.

Search the existing issues first — including closed ones, since several ideas have
already been considered and declined for the reasons listed above.

**Never open a public issue for a security problem.** Follow the private process in
[SECURITY.md](SECURITY.md) instead.

---

## Development setup

### Requirements

| Tool        | Version                                               | Notes                                             |
| ----------- | ----------------------------------------------------- | ------------------------------------------------- |
| **Node.js** | `24.16.0`, pinned in [`.node-version`](.node-version) | `nvm use` / `fnm use` picks it up automatically   |
| **npm**     | ships with Node 24                                    | The lockfile is npm's — do not use yarn or pnpm   |
| **git**     | any recent version                                    |                                                   |
| **Docker**  | optional                                              | Only for the container workflow and the docs site |

### Getting started

```bash
git clone https://github.com/<your-username>/template-nextjs.git
cd template-nextjs
make setup
make dev
```

`make setup` creates `.env` from `.env.example`, installs dependencies from the
lockfile and downloads the Playwright browsers. The manual equivalent is:

```bash
cp .env.example .env
npm ci
npm run test:e2e:install
npm run dev
```

Use `npm ci`, not `npm install`. Dependencies are pinned to exact versions
(`save-exact=true` in `.npmrc`) and `npm ci` installs exactly what the lockfile says.
`npm install` can quietly rewrite the lockfile, which turns an unrelated diff into part
of your pull request.

The dev server runs on <http://localhost:3000>.

### Docker alternative

If you would rather not install Node locally:

```bash
make up      # build and start the dev container in the background
make logs    # follow its output
make shell   # open a shell inside it
make down    # stop and remove it
```

The dev container mounts the working tree, so hot reload works as usual.

### Useful commands

`make help` lists every target with a description. The ones you will use most:

| Make                 | npm                     | What it does                                   |
| -------------------- | ----------------------- | ---------------------------------------------- |
| `make dev`           | `npm run dev`           | Dev server with Turbopack                      |
| `make check`         | `npm run check` + build | The full quality gate (see below)              |
| `make test`          | `npm run test`          | Unit tests in watch mode                       |
| `make test-coverage` | `npm run test:coverage` | Unit tests once, with coverage thresholds      |
| `make test-e2e`      | `npm run test:e2e`      | Playwright end-to-end suite                    |
| `make lint-fix`      | `npm run lint:fix`      | ESLint with autofix                            |
| `make format`        | `npm run format`        | Prettier over the whole tree                   |
| `make docs`          | —                       | Serve the docs site on <http://localhost:8000> |

---

## Workflow

1. **Fork** the repository and clone your fork.
2. **Branch** off `main`, naming the branch after the change type:

   ```
   feat/theme-toggle-keyboard-support
   fix/sitemap-trailing-slash
   docs/contributing-coverage-section
   test/security-headers-edge-cases
   ci/cache-playwright-browsers
   chore/bump-tailwind
   ```

3. **Make the change.** Keep it focused — one concern per pull request. A drive-by
   rename in an otherwise unrelated diff makes review slower for both of us.
4. **Commit** following [Conventional Commits](#commits). The `commit-msg` hook
   validates the message before it is written.
5. **Run the gate** — [see below](#before-opening-the-pull-request). Green locally
   means green in CI.
6. **Open the pull request** against `main`. Describe _what_ changed and _why_, link
   the issue it closes, and include a screenshot or a short recording for anything
   visual.

Keep your branch up to date by rebasing on `main` rather than merging `main` into it —
the history stays linear and the commitlint job stays meaningful.

---

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), **always
in English**. This is enforced twice: locally by the `commit-msg` husky hook, and in CI
by the `commitlint` job, which validates every commit in the pull request range. A
non-conforming message fails the build.

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

Rules that commitlint enforces: header no longer than 100 characters, body lines no
longer than 100 characters, lowercase type, and a subject that is not Start Case,
PascalCase or UPPER CASE.

Rules that it cannot enforce but that reviewers will:

- Write the subject in the **imperative mood** — "add", not "added" or "adds". The test
  is that it completes the sentence _"If applied, this commit will …"_.
- **No trailing period.**
- Describe **one logical change** per commit. If the message needs an "and", it is
  probably two commits.
- Use the body to explain **why**, not what. The diff already says what.

### Types

| Type       | Use it when                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `feat`     | The template gains a capability a consumer can use                             |
| `fix`      | Something that was broken now works                                            |
| `docs`     | Only documentation changes — `docs/`, markdown files, code comments            |
| `style`    | Formatting and whitespace with zero behavior change (rare; Prettier does this) |
| `refactor` | Internal restructuring that neither fixes a bug nor adds a feature             |
| `perf`     | A change made specifically to improve performance                              |
| `test`     | Adding or correcting tests, with no production code change                     |
| `build`    | Build system, bundler config, Dockerfile, or production dependency changes     |
| `ci`       | GitHub Actions workflows and anything else CI-only                             |
| `chore`    | Maintenance that fits nowhere else — tooling config, dev dependency bumps      |
| `revert`   | Reverting a previous commit                                                    |

### Examples

```
feat(theme): persist the selected theme across reloads

fix(sitemap): drop the trailing slash from the canonical origin

A NEXT_PUBLIC_SITE_URL ending in "/" produced double-slashed URLs in
sitemap.xml, which Search Console reports as duplicates.

docs(contributing): explain why the coverage floor is 100%

test(security-headers): cover the report-only branch of the CSP builder

perf(home): render the hero as a Server Component

Removes framer-free client JS from the critical path: 14.2 kB gzipped
off the first load bundle.

ci: cache the Playwright browser binaries between runs

chore(deps): bump tailwindcss from 4.3.2 to 4.3.3

revert: "feat(theme): persist the selected theme across reloads"

This reverts commit 9f2a1c4. The localStorage read ran before hydration
and caused a flash of the wrong theme on Safari.
```

### Do not add generated trailers

No `Co-authored-by:` trailers unless a real human actually co-authored the commit, and
no "generated with", "created by" or assistant attribution footers of any kind. The
history records who made the change; the tool used to make it is not part of that
record. Pull requests carrying such trailers will be asked to rewrite them.

---

## Before opening the pull request

Run the full gate, in the same order CI runs it. Later steps are the slow ones, so a
failure surfaces as early as possible:

```bash
npm run format:check   # 1. Prettier
npm run lint           # 2. ESLint
npm run typecheck      # 3. tsc --noEmit
npm run test:coverage  # 4. Vitest with the 100% thresholds
npm run build          # 5. next build
npm run test:e2e       # 6. Playwright (runs after the above in CI)
```

Or, with make:

```bash
make check      # steps 1–5, in that exact order
make test-e2e   # step 6
```

`make check` is the same gate the `quality` job runs, so if it passes locally the only
things left that can fail in CI are the end-to-end suite, CodeQL and commitlint.

If `format:check` fails, run `npm run format` (or `make format`) and commit the result.
The `pre-commit` hook runs lint-staged over the files you staged, which catches most of
this before it reaches CI — but it only sees staged files, so the full gate is still
worth running once before you push.

---

## The 100% coverage rule

`vitest.config.ts` sets statements, lines, branches and functions to **100%** over
`src/**`. Falling below any of them fails the build.

### Why

A percentage below 100 is a budget, and budgets get spent. At 90%, nobody can tell
whether the missing 10% is trivial or the one branch that silently breaks in
production, and a new untested module slides in unnoticed because the average stays
green. At 100%, the question disappears: either the code is covered or the build is
red. It is a floor, not a trophy — it says every line was executed by a test, not that
the tests are good. Writing tests worth reading is still on you.

There is also a template-specific reason: a starter that ships with a real, honest
suite gives whoever clones it a working example to imitate. A starter that ships with
70% coverage teaches them that 70% is fine.

### What it means in practice

**New code needs its spec in the same pull request.** Not a follow-up, not an issue —
the same pull request. A change that adds an untested branch does not merge.

### What is excluded, and why

Three patterns are excluded in `vitest.config.ts`:

- `src/**/index.ts` — barrels only re-export. There is no behavior to cover, and
  counting them inflates the number without testing anything.
- `src/**/*.d.ts` — declaration files, erased at compile time.
- `src/types/**` — type-only modules. They erase at compile time, so v8 instruments
  them with an empty denominator (`0/0`) and reports that as 0%, which would make the
  threshold unreachable for reasons that have nothing to do with testing.

These exclusions are deliberate and narrow. Adding a new one to get a pull request
green is not the fix — it will be asked about in review.

### When a branch is impossible to cover

Occasionally a branch resists every attempt to reach it. That is almost always a signal
about the code, not about the test:

- A defensive check for a state the type system already rules out. Delete it — the
  compiler is the test.
- A fallback for a value that can never be `undefined` given the call sites. Narrow the
  type instead.
- A conditional that exists only to satisfy an over-broad signature. Tighten the
  signature.

If a genuinely unreachable branch has to stay, it needs an explicit
`/* v8 ignore next -- <reason> */` comment stating why, and the reason will be
discussed in review. That comment should be rare enough to be surprising.

---

## Code standards

**Prettier owns formatting.** Single quotes, no semicolons, two-space indentation,
100-column print width, ES5 trailing commas — all configured in `.prettierrc`, and
Tailwind class order handled by `prettier-plugin-tailwindcss`. Never argue about style
in review: run `npm run format` and move on.

### Import through barrels

Every folder under `src/` publishes its public surface through an `index.ts`. Deep
imports into a folder's internals are an ESLint error, not a convention — see the
`no-restricted-imports` block in [`eslint.config.mjs`](eslint.config.mjs).

```ts
// Wrong — reaches past the barrel into an internal file
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'

// Right
import { cn } from '@/lib'
import { Button } from '@/components/ui'
```

Specs are exempt: a test imports the module under test directly, by design.

### Server Components by default

Everything is a Server Component unless it demonstrably cannot be. Add `'use client'`
only at the leaf that actually needs the browser — an event handler, a hook, a
`window` reference — and keep that leaf as small as possible. Marking a layout or a
page as a client component drags its entire subtree into the client bundle, which is
the single easiest way to make a fast template slow.

### Semantic color tokens

Dark mode is handled by `next-themes` driving CSS custom properties, so there are **no
`dark:` variants anywhere in the codebase**. Use the semantic tokens
(`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, …) and
both themes work for free. A hardcoded `bg-white` or a `dark:` prefix is a bug: it
looks right in one theme and wrong in the other.

Tailwind CSS 4 is configured CSS-first. There is no `tailwind.config.ts` — theme tokens
live in the stylesheet under `@theme`.

### Compose classes with `cn()`

Use the `cn()` helper (clsx + tailwind-merge) for any conditional or overridable class
list. It resolves Tailwind conflicts correctly, which naive string concatenation does
not:

```tsx
<div className={cn('px-4 py-2', isActive && 'bg-accent', className)} />
```

Always accept and forward a `className` prop on reusable components, and put it last so
the caller can override.

### Other rules

- **Pin dependencies.** `.npmrc` sets `save-exact=true`, so no `^` or `~` ever reaches
  `package.json`. Reproducible installs are non-negotiable in a template.
- **kebab-case file names** — `security-headers.ts`, `theme-toggle.tsx`. This holds for
  components too; the component inside is still `PascalCase`.
- **TypeScript is strict**, with `noUncheckedIndexedAccess` on. No `any`, no
  `@ts-ignore`. If a type is genuinely hard, ask in the pull request rather than
  escaping the type system.
- **Everything in English** — code, comments, identifiers, commits, docs, pull request
  descriptions. No exceptions.
- **Comments explain why.** The code already says what it does. A comment that
  restates the line below it is noise; a comment that records a decision or a
  non-obvious constraint is worth its weight.

---

## Tests

### Unit and component tests

Specs live in `tests/`, mirroring the structure of `src/` — no colocation. A module at
`src/lib/sanitize.ts` is tested by `tests/lib/sanitize.spec.ts`; a component at
`src/components/ui/button.tsx` by `tests/components/ui/button.spec.tsx`.

Name files `<module>.spec.ts` or `<module>.spec.tsx`, matching the module under test.

**Query by role and accessible name, not by test id.**

```tsx
// Wrong — asserts on an implementation detail and proves nothing about a11y
screen.getByTestId('submit-button')

// Right — fails if the element stops being reachable to assistive technology
screen.getByRole('button', { name: /submit/i })
```

A test written this way is an accessibility test for free: if the accessible name
disappears, the test goes red. Reach for `getByTestId` only when there is genuinely no
accessible handle, and expect to justify it.

**Keep factories local to the spec.** Build fixtures with small helper functions inside
the file that uses them. Shared fixture modules drift, accumulate optional fields for
one caller's benefit and eventually make every test harder to read than the code it
covers. Duplication across specs is cheaper than coupling between them.

Other expectations:

- Use `@testing-library/user-event` for interaction, not `fireEvent`.
- Assert on behavior a user can observe, not on internal state or call counts.
- No snapshot tests of whole components. They fail on every unrelated change and get
  regenerated without being read.

### End-to-end tests

Playwright specs live in `tests/e2e/` and run against a real production build in
Chromium.

Keep this suite **small and reserved for critical flows** — the page renders, the
navigation works, the theme toggle survives a reload, metadata and `robots.txt` are
served. Anything that can be tested at the unit level should be, because end-to-end
tests are an order of magnitude slower and flakier. A new end-to-end spec needs a
reason that the unit suite genuinely cannot cover.

---

## Documentation

The docs site is MkDocs Material, sourced from `docs/` and published to
<https://mauricioromagnollo.github.io/template-nextjs/>.

Update `docs/` when a change alters something a user of the template needs to know: a
command, an environment variable, a convention, a folder's purpose, a workflow's
required secrets. A behavior change with stale docs is an incomplete pull request.

**Adding a page requires adding it to `nav:` in `mkdocs.yml`.** The site is built with
`mkdocs build --strict`, which turns broken internal links, unknown nav entries and
orphan pages into build failures. A new page that is not in the nav will fail CI.

Preview locally before pushing:

```bash
make docs        # live-reloading server on http://localhost:8000
make docs-build  # the same --strict build CI runs
```

Both run MkDocs through a pinned Docker image, so there is no Python setup to do.

### Architecture decision records

Write an ADR when a decision is one that a future reader will otherwise reopen: adding
or removing a dependency, changing the testing strategy, restructuring `src/`,
replacing part of the toolchain, or accepting a trade-off that looks wrong without
context. ADRs go under `docs/decisions/`, start from `docs/decisions/template.md`, and
follow the format of the existing ones — context, decision, consequences. Add the new
file to `nav:` in `mkdocs.yml`, or the strict docs build fails.

The test is simple: if you can imagine somebody six months from now asking "why on
earth is it done this way?", write the ADR now and answer them.

---

## Review

This is a solo, part-time project. Expect a **first response within about five business
days**. If a week goes by with nothing, a polite bump on the pull request is welcome —
it is far more likely that the notification got buried than that the work is being
ignored.

What review looks like here:

- **CI first.** A red pull request is not reviewed until it is green. Everything CI
  checks is mechanical; there is no point spending human attention on it.
- **Scope first, then code.** The first question is always whether the change belongs
  in a template. Getting that agreed in an issue beforehand is why the issue step
  exists.
- **Questions are questions.** A comment asking why something is done a certain way is
  usually a genuine request for context, not a veiled demand to change it. "Because X"
  is a perfectly good answer and often ends the thread.
- **Small pull requests merge fast.** A focused 40-line diff can land the same day. A
  600-line diff touching eight concerns will sit, because reviewing it properly needs a
  block of time that a part-time maintainer rarely has in one piece.
- **Nits are labeled.** Anything prefixed with "nit:" is optional and will never block a
  merge.

Pull requests are squash-merged, so intermediate commits on your branch do not need to
be perfect — but the final squashed message will be a Conventional Commit, and a clean
branch history makes writing it easier.

---

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Report
unacceptable behavior to <mauricioromagnollo@gmail.com>.

## License

This project is licensed under the [MIT License](LICENSE). By contributing, you agree
that your contributions will be licensed under the same terms.
