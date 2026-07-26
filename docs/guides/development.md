# Development

The day-to-day loop, the gates that stand between you and `main`, and the recipe for adding a
component.

## The loop

```bash
make dev
```

Next starts with **Turbopack** on <http://localhost:3000>. Save a file and the change appears without
a full reload; React state in client components survives, and Server Component edits re-render on the
server and stream the new HTML in.

What survives a hot update and what does not:

| Change | Effect |
| --- | --- |
| A component's JSX or styles | Applied in place, state preserved. |
| A new `@theme` token in `globals.css` | Applied immediately — Tailwind 4 has no config to restart. |
| A `lib/` or `config/` module | Applied; modules importing it re-evaluate. |
| `.env` | **Requires a restart.** Environment variables are read at process start. |
| `next.config.ts` | **Requires a restart.** Next reloads it, but the security headers are computed once. |
| `tsconfig.json` paths | Restart, and restart the editor's TypeScript server too. |

Two terminals is the usual setup: one running `make dev`, one running `make test-watch`.

```bash
make test-watch   # vitest in watch mode — reruns only what your change touched
```

Vitest watches the dependency graph, so editing `src/lib/cn.ts` reruns every spec that imports it,
directly or transitively, and nothing else.

---

## The local gate

Before pushing, run what CI runs:

```bash
make check
```

That is five steps, ordered cheapest first so a mistake surfaces in seconds rather than minutes:

```text
format-check  →  lint  →  typecheck  →  test-coverage  →  build
   ~1s            ~5s       ~5s            ~15s            ~30s
```

| Step | Fixes itself with |
| --- | --- |
| `format-check` | `make format` |
| `lint` | `make lint-fix` (for the auto-fixable rules) |
| `typecheck` | You. |
| `test-coverage` | A spec — open `coverage/index.html` for the red lines. |
| `build` | You. A build that only fails in CI is usually a type error Next catches and `tsc` does not. |

!!! note "`make check` runs one step more than `npm run check`"

    The npm script stops after `test:coverage`. The make target adds `build`, matching the `quality`
    job in CI step for step.

The end-to-end suite is **not** in `check`, because it builds the application and takes minutes. Run
it separately when your change touches rendering, routing or metadata:

```bash
make test-e2e
```

!!! tip "Run `make check` before you open the pull request, not after CI turns red"

    It is the same list of steps the `quality` job runs. The only reason CI would disagree is a Node
    version mismatch — check `.node-version`.

---

## The commit hooks

`husky` installs Git hooks during `npm ci` (through the `prepare` script). Two of them are active:

### `pre-commit` — lint-staged

Runs against **staged files only**, so a large repository does not pay for a one-line change:

```json title="package.json (excerpt)"
"lint-staged": {
  "*.{ts,tsx,js,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"]
}
```

Auto-fixable problems are fixed and re-staged silently. Anything ESLint cannot fix — an unused
variable, a deep barrel import — aborts the commit with the rule's message.

### `commit-msg` — commitlint

Validates the message against `commitlint.config.mjs`. A malformed message aborts the commit.

!!! warning "Do not reach for `--no-verify`"

    The hooks take about two seconds and they run the same checks that will block your pull request
    anyway. `HUSKY=0` exists for CI (which runs the real checks directly) — not for skipping them
    locally.

---

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), enforced locally by the hook and in CI
by the `commitlint` job, which walks every commit in the pull request range.

```text
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

Allowed types, from the explicit `type-enum` in `commitlint.config.mjs`:

| Type | Use it for |
| --- | --- |
| `feat` | A user-visible capability. |
| `fix` | A bug fix. |
| `docs` | Documentation only — including everything under `docs/`. |
| `style` | Formatting with no behaviour change. |
| `refactor` | Restructuring with no behaviour change. |
| `perf` | A performance improvement. |
| `test` | Adding or fixing tests. |
| `build` | Build system, Docker, dependencies. |
| `ci` | Workflow files. |
| `chore` | Maintenance that fits nowhere else. |
| `revert` | Reverting a previous commit. |

Rules that will reject a message:

- Header longer than **100 characters**.
- Body lines longer than **100 characters**.
- A subject in `Start Case`, `PascalCase` or `UPPER CASE`.
- A type outside the list above.

```text
✓ feat(ui): add a size prop to the button component
✓ fix(seo): drop the trailing slash from canonical urls
✓ docs(decisions): record the tailwind v4 token decision
✓ chore(deps): bump next to 16.2.12

✗ Added a button size prop          (no type)
✗ feat: Add A Button Size Prop      (start case subject)
✗ update stuff                      (no type, says nothing)
✗ feat(ui): add a size prop to the button component so that consumers can render compact variants in dense layouts   (over 100 chars)
```

### Breaking changes

Either a `!` after the type or a `BREAKING CHANGE:` footer:

```text
feat(config)!: rename siteConfig.links.twitter to links.x

BREAKING CHANGE: `siteConfig.links.twitter` no longer exists. Rename the key in
`src/config/site/site-config.ts` and any footer overrides.
```

---

## Branches

Branch off `main`, name it `<type>/<short-description>` with the same type vocabulary:

```text
feat/pricing-section
fix/canonical-trailing-slash
docs/deployment-guide
chore/bump-playwright
```

Keep branches short-lived. `main` is always deployable — every push to it triggers a Vercel
**preview** deploy. Production ships separately, when a GitHub release is published.

### Pull requests

- Title follows the commit convention (it becomes the squash-merge commit message).
- Describe **why**, not just what. The diff already says what.
- Wait for CI: `quality`, `e2e` and `commitlint` all have to pass.
- Squash merge, so `main` keeps one clean, conventional commit per change.

---

## Adding a component, step by step

The example is a `Badge` primitive.

=== "1. Write the component"

    ```tsx title="src/components/ui/badge.tsx"
    import type { ComponentProps } from 'react'

    import { cn } from '@/lib'

    export type BadgeProps = ComponentProps<'span'> & {
      variant?: 'default' | 'accent'
    }

    export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            variant === 'default' && 'bg-muted text-muted-foreground',
            variant === 'accent' && 'bg-accent text-accent-foreground',
            className // (1)!
          )}
          {...props}
        />
      )
    }
    ```

    1.  Always last, so a caller can override any of the defaults above it.

    No `'use client'` — it has no interactivity. No `dark:` classes — the tokens handle that.

=== "2. Export it from the barrel"

    ```ts title="src/components/ui/index.ts"
    export * from './badge'
    export * from './button'
    export * from './card'
    export * from './container'
    export * from './section-heading'
    export * from './theme-toggle'
    ```

    Skip this and the component is unreachable: `no-restricted-imports` blocks
    `@/components/ui/badge` from application code.

=== "3. Write the spec — not optional"

    ```tsx title="tests/components/ui/badge.spec.tsx"
    import { render, screen } from '@testing-library/react'
    import { describe, expect, it } from 'vitest'

    import { Badge } from '@/components/ui/badge'

    describe('Badge', () => {
      it('renders its children', () => {
        render(<Badge>New</Badge>)

        expect(screen.getByText('New')).toBeInTheDocument()
      })

      it('applies the accent variant', () => {
        render(<Badge variant="accent">New</Badge>)

        expect(screen.getByText('New')).toHaveClass('bg-accent')
      })

      it('merges a caller className over the defaults', () => {
        render(<Badge className="px-8">New</Badge>)

        expect(screen.getByText('New')).toHaveClass('px-8')
        expect(screen.getByText('New')).not.toHaveClass('px-2.5')
      })
    })
    ```

    Both variants are covered because `branches: 100` counts each side of the `variant === …`
    conditions. The third test is the one that actually verifies `cn()` is merging rather than
    concatenating.

=== "4. Verify and commit"

    ```bash
    make check
    git add src/components/ui/badge.tsx src/components/ui/index.ts tests/components/ui/badge.spec.tsx
    git commit -m "feat(ui): add badge component"
    ```

    The `pre-commit` hook formats and lints the staged files; `commit-msg` validates the message.

### Checklist

- [ ] File is kebab-case under the right folder.
- [ ] No `'use client'` unless it needs an event handler, a hook or a browser API.
- [ ] `className` merged through `cn()`, positioned last.
- [ ] Semantic colour tokens only — no `dark:`, no `bg-zinc-*`, no `bg-[#hex]`.
- [ ] Props type exported.
- [ ] Exported from the folder's `index.ts`.
- [ ] Spec at the mirrored path in `tests/`, covering every branch.
- [ ] `make check` passes.

---

## Adding a dependency

```bash
npm install <package>
```

`.npmrc` pins the exact version automatically. Then:

1. Commit `package.json` **and** `package-lock.json` together.
2. If it runs in the browser and loads anything from another origin, check the
   [CSP](../architecture/security.md#extending-the-csp).
3. Use `feat` or `build` as the commit type depending on whether it ships a user-visible change.

Before you install, be sure it earns its place. The template ships nine runtime dependencies, and
each one is code you now ship, review and trust.

---

## Troubleshooting

??? question "ESLint: “Import from the folder barrel … instead of an internal file”"

    You wrote `@/lib/seo` or `@/components/ui/button`. Import from `@/lib` / `@/components/ui`
    instead. In `tests/**` the rule is off, so a spec may import the module directly.

??? question "Coverage fails at 99.x%"

    Open `coverage/index.html`. Red lines are uncovered statements; yellow markers in the gutter are
    uncovered branches — usually the else side of a conditional or a default parameter value.

??? question "The theme flashes white on reload"

    `suppressHydrationWarning` is missing from `<html>`, or `Providers` is no longer wrapping the
    tree in `layout.tsx`. `next-themes` needs both to set the class before first paint.

??? question "A change to `.env` does nothing"

    Restart the dev server. Environment variables are read once, at process start.

??? question "Turbopack serves stale output"

    ```bash
    rm -rf .next && make dev
    ```

    `make clean` does this plus `coverage/` and the Playwright report directories.
