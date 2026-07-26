# Testing

Two suites, two runners, one rule: nothing merges without both green.

| Suite | Runner | Location | Command |
| --- | --- | --- | --- |
| Unit / component | Vitest 4 + Testing Library, jsdom | `tests/**` (except `tests/e2e/`) | `npm run test:unit` |
| End-to-end | Playwright 1.62, Chromium | `tests/e2e/**` | `npm run test:e2e` |

---

## Where specs live

**Specs are not colocated.** `src/` holds what ships; `tests/` holds what proves it works, in a tree
that mirrors `src/` exactly:

```text
src/lib/seo.ts                 →  tests/lib/seo.spec.ts
src/components/ui/button.tsx   →  tests/components/ui/button.spec.tsx
src/app/sitemap.ts             →  tests/app/sitemap.spec.ts
```

Enforced at both ends by `vitest.config.ts`:

```ts title="vitest.config.ts (excerpt)"
include: ['tests/**/*.{test,spec}.{ts,tsx}'],
exclude: ['tests/e2e/**', 'node_modules/**'],
```

Why not colocate, when colocation is the more common convention?

- **`src/` stays shippable.** Everything under it is application code. No `.spec` files to exclude
  from a build, from coverage globs, or from a `find` command.
- **A missing spec is visible.** The two trees are supposed to be symmetric; an asymmetry is a
  question a reviewer can ask by looking at the file list.
- **Mocks and fixtures have an obvious home** — inside `tests/`, next to the specs that use them,
  instead of inside the source tree.

The cost is honest: you jump between two trees instead of one. Editors with fuzzy file switching make
that a non-issue, and the coverage floor guarantees the mirror never goes stale.

---

## The 100% floor

```ts title="vitest.config.ts (excerpt)"
thresholds: {
  statements: 100,
  lines: 100,
  branches: 100,
  functions: 100,
},
```

Any metric below 100 fails `npm run test:coverage`, which fails `make check`, which fails CI.

The threshold is not there because 100% coverage means the code is correct — it does not, and
[ADR 0001](../decisions/0001-100-percent-coverage-threshold.md) argues that point at length. It is
there because **100 is the only number that does not decay.** A threshold of 85 leaves 15% of the
code that nobody can point at, and the first "we will come back to it" is the last one. At 100, a
module without a spec does not lower a percentage — it turns CI red, immediately, in the pull request
that introduced it.

That works here because the codebase is small and mostly pure. It would be a bad default for a large
application with an unavoidable I/O surface.

### What is excluded, and why

```ts title="vitest.config.ts (excerpt)"
exclude: [
  // Barrels only re-export; there is nothing to cover in them.
  'src/**/index.ts',
  'src/**/*.d.ts',
  // Type-only modules erase at compile time, so v8 instruments them with
  // an empty denominator (0/0) and reports that as 0%.
  'src/types/**',
],
```

Three exclusions, each with a technical reason rather than a convenience one:

`src/**/index.ts`
: A barrel is a list of `export … from` statements. It contains no branches and no functions. Its
correctness is proven by the fact that anything importing through it compiles.

`src/**/*.d.ts`
: Declarations. No runtime output at all.

`src/types/**`
: Type-only modules erase entirely during compilation. v8 instruments the resulting empty file with
a denominator of zero and reports `0%`, which would make a 100% threshold unreachable for reasons
that have nothing to do with testing.

!!! danger "Adding an exclusion is an architectural decision"

    The list above is short on purpose. If you need to exclude a real module, the honest options are:
    make it testable (usually by pushing the untestable part into a thinner wrapper), or write the
    exclusion down in an ADR with the reason. "It is hard to test" is a fact about the design, not
    about the test runner.

---

## Running the unit suite

```bash
npm run test:unit      # single run — what CI does
npm run test:watch     # watch mode for development
npm run test           # alias for watch mode
npm run test:coverage  # single run + coverage report + thresholds
```

Make equivalents: `make test`, `make test-watch`, `make test-unit`, `make test-coverage`.

`test:coverage` writes three reporters: `text` to the terminal, `lcov` for editor gutters and
external tools, and `html` to `coverage/`. When a run fails on a threshold, open the report and go
straight to the red lines:

```bash
open coverage/index.html
```

CI uploads that directory as an artifact on **both** success and failure — a threshold violation is
exactly when a reviewer wants the report.

Useful filters while iterating:

```bash
npx vitest run tests/lib/seo.spec.ts     # one file
npx vitest run -t "returns a canonical"  # one test name
```

---

## `tests/setup-tests.ts`

Loaded before every test file. It handles the four things that would otherwise be repeated in every
spec:

1. **`@testing-library/jest-dom`** matchers — `toBeInTheDocument`, `toHaveAccessibleName`,
   `toHaveClass`, and the rest.
2. **`installDomStubs()` before each test**, from `tests/helpers/dom-stubs.ts`. It stubs
   `matchMedia`, `IntersectionObserver` and `ResizeObserver` — none of which jsdom implements, and
   the first of which `next-themes` calls on mount, so without it every test that renders
   `Providers` throws.
3. **`cleanup()` after each test**, so a component from one test cannot be found by the next.
4. **A global and document reset** — `vi.unstubAllGlobals()`, `vi.unstubAllEnvs()`, and clearing the
   `class`/`style`/`lang` attributes React 19 applies to the real `<html>` and `<body>` when a spec
   renders the root layout.

Every stub goes through `vi.stubGlobal` rather than a direct assignment to `window`, so the single
`vi.unstubAllGlobals()` guarantees nothing leaks between specs.

The ESLint config relaxes three rules for `tests/**` so mocks stay convenient:
`@next/next/no-img-element` and `jsx-a11y/alt-text` (a `next/image` mock would render a bare
`<img>`), and unused-variable reporting for parameters prefixed with `_`.

---

## How to query: roles, not test ids

Testing Library exposes a priority order, and the template sticks to it. Query the way a user — or a
screen reader — finds things:

```tsx
// ✓ Best: role + accessible name. Fails if the element stops being a button,
//   or loses its label — both of which are real accessibility regressions.
screen.getByRole('button', { name: /toggle theme/i })
screen.getByRole('heading', { level: 1, name: /next\.js template/i })
screen.getByRole('link', { name: /github/i })

// ✓ Fine for form fields
screen.getByLabelText(/email/i)

// ~ Acceptable for non-interactive text assertions
screen.getByText(/production-ready/i)

// ✗ Last resort — couples the test to markup a user never sees
screen.getByTestId('theme-toggle')
```

Why it matters beyond style: `getByRole('button', { name: 'Toggle theme' })` **is an accessibility
assertion**. If someone replaces the `<button>` with a clickable `<div>`, or drops the `aria-label`
from an icon-only control, the test fails — and it should, because the component just became unusable
with a keyboard or a screen reader. A `data-testid` would have kept passing.

There is no `getByTestId` in the template's specs today. Keep it that way if you can.

### A component spec, end to end

```tsx title="tests/components/ui/theme-toggle.spec.tsx"
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTheme } from 'next-themes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeToggle } from '@/components/ui/theme-toggle'

vi.mock('next-themes', () => ({ useTheme: vi.fn() }))

describe('ThemeToggle', () => {
  const setTheme = vi.fn()

  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme } as never)
  })

  it('exposes an accessible name', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
  })

  it('switches to dark when the current theme is light', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /theme/i }))

    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})
```

Three things to notice:

- The import is `@/components/ui/theme-toggle`, not `@/components/ui`. The barrel rule is switched
  off for `tests/**` because a spec should target exactly one module.
- `userEvent` over `fireEvent`. It dispatches the full sequence a real interaction produces
  (pointerdown, mousedown, focus, click) and catches bugs `fireEvent` walks past.
- Both branches of the toggle are exercised. With `branches: 100`, testing only the light-to-dark
  direction fails the build.

### Testing server-side modules

Most of `lib/`, `config/` and the metadata routes are plain functions — call them and assert the
return value. No rendering, no mocking:

```ts title="tests/app/robots.spec.ts"
import { describe, expect, it } from 'vitest'

import robots from '@/app/robots'

describe('robots', () => {
  it('should allow every crawler', () => {
    expect(robots().rules).toEqual([{ userAgent: '*', allow: '/' }])
  })
})
```

`rules` is an array — `MetadataRoute.Robots` accepts one entry or many, and the template always emits
a list so adding a second user-agent block is not a shape change.

For environment-dependent behaviour, use `vi.stubEnv` with `vi.unstubAllEnvs()` in `afterEach`,
rather than assigning to `process.env` directly — the module registry caches, and a leaked variable
turns into a test that only fails when the suite runs in a different order.

---

## End-to-end tests

Playwright drives a real Chromium against a **production build** — not the dev server, and not jsdom.
That is the difference in kind: the unit suite proves a component's logic, the E2E suite proves the
thing actually boots, renders, hydrates and responds.

```bash
npm run test:e2e:install   # once — downloads Chromium + OS dependencies
npm run test:e2e           # run the suite
```

Make equivalents: `make test-e2e-install`, `make test-e2e`.

Useful during development:

```bash
npx playwright test --ui        # time-travel debugger
npx playwright test --headed    # watch the browser
npx playwright test --debug     # step through with the inspector
npx playwright show-report      # open the last HTML report
```

### The `webServer` block

```ts title="playwright.config.ts (excerpt)"
webServer: process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      command: process.env.CI ? 'npm run start' : 'npm run build && npm run start',
      url: baseURL,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
```

Three modes, one config:

| Situation | Behaviour |
| --- | --- |
| Local, no env vars | Builds the app, starts the production server, waits for it, runs the suite, shuts it down. |
| CI | Only starts the server — the workflow already ran `npm run build` in a previous step, and building twice would waste minutes. |
| `PLAYWRIGHT_BASE_URL` set | Starts nothing. Runs against whatever URL you give it. |

That last mode is how you smoke-test a deploy preview:

```bash
PLAYWRIGHT_BASE_URL=https://my-site-git-feature-me.vercel.app npm run test:e2e
```

`reuseExistingServer: !process.env.CI` means a server you already have running on the port is reused
locally (fast iteration) but never on CI (where a stale server would be a correctness problem).

### Why Chromium only

Cross-browser testing is valuable when the application has enough behaviour for browsers to disagree
about. A server-rendered site with one interactive control does not.

The trade-off, stated plainly:

- **Gained:** the E2E job finishes in a couple of minutes instead of three times that; one browser
  binary to cache; no flaky-on-WebKit-only failures to triage.
- **Lost:** genuine Safari and Firefox rendering bugs are not caught automatically.

Adding them back is four lines:

```ts title="playwright.config.ts"
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

Then update `test:e2e:install` to drop `chromium` so all three browsers are downloaded. If your
audience is disproportionately on iOS, do it.

### Other configured behaviour

| Setting | Value | Reason |
| --- | --- | --- |
| `fullyParallel` | `true` | Specs must not depend on each other. If one does, that is the bug. |
| `forbidOnly` | `!!process.env.CI` | A stray `test.only` fails CI instead of silently skipping the suite. |
| `retries` | `2` on CI, `0` locally | Absorbs infrastructure flake in CI; locally a flake should be visible. |
| `trace` | `'on-first-retry'` | A full trace — DOM snapshots, network, console — is recorded only when a test actually failed once. Zero cost on green runs. |
| `reporter` | `github` + `html` on CI, `list` locally | Failures annotate the pull request diff directly. |

The workflow uploads `playwright-report/` as an artifact on failure. Download it, run
`npx playwright show-report`, and step through the trace of the exact failing run.

### What belongs in an E2E spec

Keep the suite small. Every spec here costs minutes on every pull request, and anything a unit test
can prove should be proven there instead.

Good candidates:

- The home page renders and returns 200.
- The document has a title, a description and a canonical link.
- `/sitemap.xml` and `/robots.txt` respond with the expected content type.
- The theme toggle switches the theme and the choice survives a reload.
- An unknown URL renders the 404 page.
- Keyboard navigation reaches the primary call to action.

```ts title="tests/e2e/home.spec.ts"
import { expect, test } from '@playwright/test'

test('renders the landing page with metadata', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
})

test('remembers the selected theme across reloads', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /theme/i }).click()

  const theme = await page.locator('html').getAttribute('class')

  await page.reload()

  await expect(page.locator('html')).toHaveClass(theme ?? '')
})
```

---

## Before you push

```bash
make check      # format, lint, types, unit tests + coverage, build
make test-e2e   # the browser suite
```

Those are the same commands CI runs, in the same order. Running them locally turns a twelve-minute
feedback loop into a one-minute one.
