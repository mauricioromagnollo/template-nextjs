# Conventions

The rules below are what keep the codebase readable as it grows. Most of them are enforced by ESLint,
Prettier or TypeScript — the ones that are not are listed here so a reviewer can point at them.

## Barrel imports

Every folder under `src/` publishes its public surface through an `index.ts`. Importing an internal
file directly is an **error**, not a style preference:

```js title="eslint.config.mjs (excerpt)"
'no-restricted-imports': [
  'error',
  {
    patterns: [
      { group: ['@/lib/*'], message: BARREL_MESSAGE },
      { group: ['@/components/ui/*'], message: BARREL_MESSAGE },
      { group: ['@/components/layout/*'], message: BARREL_MESSAGE },
      { group: ['@/config/*/*'], message: BARREL_MESSAGE },
    ],
  },
],
```

:material-close-circle:{ style="color: #d32f2f" } **Wrong**

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/config/site/site-config'
```

:material-check-circle:{ style="color: #2e7d32" } **Right**

```tsx
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui'
import { buildMetadata, cn } from '@/lib'
```

Two exemptions are configured on purpose:

- **`tests/**`** — a spec imports the exact module it tests, so the rule is off there.
- **Config files** (`*.config.{ts,mjs}`, `next.config.ts`) — `next.config.ts` imports
  `./src/lib/security-headers` by relative path, before the `@/` alias is even in play.

When you add a module, export it from the folder's `index.ts` in the same commit. A module that is
not exported is unreachable from application code.

The trade-offs — import cycles, barrel size, bundler impact — are argued in
[ADR 0003](../decisions/0003-barrel-imports-enforced-by-eslint.md), which also tells you exactly what
to delete if you disagree.

---

## `'use client'` on the leaves only

Covered in the [architecture overview](index.md#rsc-first), repeated here because it is the rule most
often broken by habit:

```tsx title="src/components/layout/header.tsx — a Server Component"
import { Container, ThemeToggle } from '@/components/ui'

import { NavLinks } from './nav-links'

export function Header() {
  return (
    <header className="border-border border-b">
      <Container className="flex h-16 items-center justify-between">
        <NavLinks />
        <ThemeToggle /> {/* the only client code in this subtree */}
      </Container>
    </header>
  )
}
```

The header renders a client component without becoming one. Adding `'use client'` at the top of this
file would pull `Container`, `NavLinks` and everything they import into the browser bundle for no
benefit.

!!! warning "`'use client'` is contagious downward, not upward"

    Marking a parent forces every descendant module into the client bundle. Marking a child forces
    nothing on the parent. Always push the directive down.

---

## File naming

**kebab-case for every file and folder**, without exception:

```text
src/components/ui/section-heading.tsx    ✓
src/components/ui/SectionHeading.tsx     ✗
src/lib/security-headers.ts              ✓
src/lib/securityHeaders.ts               ✗
tests/lib/security-headers.spec.ts       ✓
```

The *exports* keep their idiomatic casing — `PascalCase` for components and types, `camelCase` for
functions and values. Only the filename is kebab-case.

Rationale: macOS and Windows filesystems are case-insensitive, Linux is not. A rename that only
changes case is invisible to Git on a Mac and breaks the build on CI. One casing convention for
filenames removes the entire class of problem.

Spec files use the `.spec.ts` / `.spec.tsx` suffix and live at the mirrored path under `tests/`.

---

## Semantic colour tokens, never raw colours

```tsx
// ✗ Wrong — a raw palette colour, and now it needs a dark: variant
<div className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">

// ✓ Right — semantic tokens that already know what dark mode means
<div className="bg-background text-foreground">
```

The token set — `background`, `foreground`, `muted`, `muted-foreground`, `border`, `primary`,
`primary-foreground`, `accent`, `accent-foreground` — is defined once in `@theme` and redefined under
`.dark`. Using it is what makes the "no `dark:` classes" rule possible.

**If you find yourself writing a `dark:` class, the token you need does not exist yet.** Add it to
`@theme` instead. See [Styling](styling.md).

---

## Compose classes with `cn()`

`src/lib/cn.ts` is `clsx` (conditional class lists) piped through `tailwind-merge` (last-conflicting-
utility-wins):

```ts title="src/lib/cn.ts"
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

Every component that accepts a `className` prop must merge it through `cn()`, with the incoming
prop **last**:

```tsx
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('border-border flex flex-col gap-3 rounded-xl border p-6', className)}
      {...props}
    />
  )
}
```

Order matters. `cn('p-6', 'p-2')` yields `'p-2'`, so putting the caller's `className` last is what
makes a component overridable. Plain template strings do not do this — `` `p-6 ${className}` ``
produces `"p-6 p-2"` and lets CSS specificity decide, which is a coin flip.

---

## Pinned dependencies

`.npmrc` sets `save-exact=true`, so `npm install <pkg>` writes `"1.2.3"` rather than `"^1.2.3"`.
Every entry in `package.json` is an exact version, and upgrades arrive as reviewable Dependabot pull
requests rather than as a silent difference between two `npm install` runs on two machines.

When you add a dependency:

1. `npm install <pkg>` — the pin is automatic.
2. Commit `package.json` **and** `package-lock.json` together.
3. Never hand-edit a version to a range. If you need a range, you need a reason, and the reason
   belongs in the pull request description.

---

## Comments

Comment the **why**, never the **what**. The code already states what it does; a comment that
restates it is one more thing to keep in sync.

:material-close-circle:{ style="color: #d32f2f" } **Noise**

```ts
// Increment the counter by one
counter += 1

// Loop through the items
for (const item of items) {
```

:material-check-circle:{ style="color: #2e7d32" } **Worth writing**

```ts
// Type-only modules erase at compile time, so v8 instruments them with an
// empty denominator (0/0) and reports that as 0%.
exclude: ['src/types/**'],
```

```ts
// Bind to every interface — the default (localhost) is unreachable from
// outside the container.
ENV HOSTNAME=0.0.0.0
```

Things that deserve a comment:

- A non-obvious constraint imposed by a tool ("Next requires error boundaries to be client
  components").
- A deliberate deviation from the obvious approach, and why.
- A workaround, with a link to the upstream issue.
- Ordering that matters ("cheapest checks first so a broken PR fails in seconds").

Things that do not:

- Restating the function name.
- Commented-out code — Git remembers it.
- `// TODO` with no owner and no issue link. Open an issue instead.

Use JSDoc on exported functions whose contract is not obvious from the signature — especially in
`lib/`, where the argument is often a plain `string` and the guarantee is what matters
(`sanitizeHref` returns `undefined` for anything it cannot vouch for, so the caller drops the link
entirely).

---

## Everything in English

Code, comments, commit messages, branch names, pull request titles, documentation, test names and
user-facing strings. The project is open source; English is its lingua franca, and a codebase that
mixes languages forces every reader to context-switch.

---

## TypeScript

- **No `any`.** If a type is genuinely unknown, use `unknown` and narrow it.
- **No non-null assertions (`!`)** where a guard will do. `noUncheckedIndexedAccess` is on precisely
  so that `items[0]` is `T | undefined`; handle it.
- **`as const`** on configuration objects, so literal types survive.
- **Export the props type** next to each component (`export type ButtonProps = …`) — specs and
  consumers both need it.
- **Prefer `type` over `interface`** for props and unions, for consistency. Neither is wrong; picking
  one avoids the debate.

---

## Formatting

Prettier decides. Single quotes, no semicolons, two-space indentation, 100-column lines, ES5 trailing
commas, and `prettier-plugin-tailwindcss` sorting utility classes into canonical order.

Do not argue with it and do not add `// prettier-ignore` to preserve a hand-made alignment.
`format:check` is the first step in CI, and lint-staged formats staged files on every commit, so
drift is not possible for long.
