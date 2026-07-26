# ADR-0003 — Enforce barrel imports with ESLint

## Status

**Accepted** — 2026-07-25

## Context

Without a rule, import paths in a codebase drift. The same module ends up imported four ways —
`@/lib/seo`, `@/lib/seo.ts`, `../../lib/seo`, `@/lib` — and every rename becomes a
find-and-replace across the tree.

More importantly, without a rule **every file in a folder is public**. `src/lib/sanitize.ts` may
export a helper that exists only to support `serializeJsonLd`; nothing stops another module importing
it directly, and once one does, it is part of the folder's API whether or not that was intended.
TypeScript has no `internal` visibility for modules, so the only way to draw the line is by
convention — and a convention nobody enforces is a preference.

The template already uses `index.ts` barrels in every folder under `src/`. The question was whether
to *require* them.

Alternatives considered:

| Option | Why not |
| --- | --- |
| No convention | Four import styles for the same module. No public/private distinction. |
| Barrels by convention, unenforced | Works until the third contributor, or the first AI-generated patch. Review has to catch it every time. |
| Deep imports only, no barrels | Zero cycle risk and maximum bundler friendliness, but no way to mark anything internal, and rename churn spreads across every consumer. |
| `package.json` `"exports"` per folder | The most robust option — real module boundaries. Requires each folder to be a workspace package, which is monorepo machinery this template does not need. |
| **Barrels enforced by ESLint** | Chosen. |

## Decision

We enforce barrel imports with `no-restricted-imports` in the ESLint flat config. A deep import into
a folder that has a barrel is an **error**, not a style comment.

```js title="eslint.config.mjs"
const BARREL_MESSAGE =
  'Import from the folder barrel (e.g. @/lib, @/components/ui) instead of an internal file. ' +
  'See docs/architecture/conventions.md.'

{
  rules: {
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
  },
}
```

```tsx
// ✗ Error
import { Button } from '@/components/ui/button'
import { buildMetadata } from '@/lib/seo'

// ✓ Correct
import { Button } from '@/components/ui'
import { buildMetadata } from '@/lib'
```

Two exemptions are configured deliberately:

```js
{
  files: ['tests/**/*.{ts,tsx}'],
  rules: {
    // Specs import the module under test directly by design; the barrel
    // convention applies to application code only.
    'no-restricted-imports': 'off',
  },
},
{
  files: ['*.config.{ts,mjs}', 'next.config.ts'],
  rules: {
    'no-restricted-imports': 'off',
  },
}
```

**Tests** target exactly one module — that is what makes a unit test a unit test, and importing
through a barrel would drag unrelated modules into the spec's dependency graph. **Config files** run
outside the `@/` alias: `next.config.ts` imports `./src/lib/security-headers` by relative path,
before any of this applies.

Note that intra-folder relative imports are unaffected: `header.tsx` importing `./nav-links` is fine
and expected. The rule governs how *other* folders reach in.

## Consequences

### Positive

- **Folders have a public API.** What the barrel exports is public; everything else is an
  implementation detail. Splitting `seo.ts` into three files changes nothing for consumers, as long
  as the barrel keeps exporting the same names.
- **Refactoring is cheap.** Rename, move or split a file freely — one line changes in `index.ts` and
  no consumer notices.
- **One import path per module.** No mixture of alias depths and relative traversals. Diffs stay
  clean and merge conflicts on import blocks largely disappear.
- **Shorter, tidier import blocks.** Three symbols from `lib/` are one line, not three.
- **Enforced, not discussed.** The rule fails in the editor, at `pre-commit`, and in CI, with a
  message that names the fix and links to the documentation. Nobody spends review time on it.
- **New modules are announced.** Adding a file means adding a line to the barrel, which shows up in
  the diff. A module that was never exported is visibly unused.

### Negative

- **Import cycles become possible, and they are the real cost.** If `lib/seo.ts` imports from `@/lib`
  (its own barrel) and that barrel also exports `sanitize.ts`, you have a cycle. It usually works,
  because bundlers tolerate cycles — until it does not, and the symptom is an `undefined` at module
  initialisation time in one environment only, which is a genuinely miserable debugging session.
  **Mitigation:** inside a folder, always use relative sibling imports (`./sanitize`), never the
  folder's own barrel. The rule does not prevent this; discipline and review do.
- **Barrels can grow into dumping grounds.** An `index.ts` with forty `export *` lines is a folder
  that should have been split. The barrel makes the problem easy to ignore, because consumers see one
  tidy import either way.
- **Historically a bundler hazard.** Barrels used to defeat tree-shaking: importing one symbol pulled
  in every module the barrel touched. Modern bundlers — including Turbopack and webpack with
  `sideEffects: false` — handle this well, and Next.js additionally ships
  `optimizePackageImports`. Still, a barrel that re-exports a heavy module means anything importing
  *anything* from that folder pays for the parse. Worth watching if `lib/` acquires a large
  dependency.
- **One extra step when adding a file.** Forget the `export` line and the module is unreachable from
  application code, with an error message that points at the import rather than at the omission.
- **Editor auto-import fights it.** VS Code will happily insert `@/components/ui/button`, ESLint will
  reject it, and you will fix it by hand. Setting
  `"typescript.preferences.autoImportFileExcludePatterns"` helps; it does not eliminate it.
- **Marginally slower cold type-checking.** Every barrel import pulls the whole folder's type graph.
  Immeasurable at this size, real in a large monorepo.

### Neutral

- The rule only covers `@/lib`, `@/components/ui`, `@/components/layout` and `@/config/*`. A new
  top-level folder needs a new pattern entry, or it is unenforced.
- `@/app/*` is deliberately absent. App Router files are entry points the framework loads by path;
  they are not imported by other application code.

## Revisit if

- An import cycle bites in production. One is a bug; a second is evidence that the mitigation is not
  holding, and the answer may be per-file imports.
- A barrel exceeds roughly twenty exports. Split the folder first; if that is not possible, question
  the rule.
- Bundle analysis shows a barrel dragging a heavy module into a route that does not use it.
- The project becomes a monorepo, at which point `package.json` `"exports"` is a stronger boundary
  and this rule is redundant.

## Opting out

Delete the `no-restricted-imports` block from `eslint.config.mjs`. That is the entire change — the
barrels keep working, both import styles become legal, and nothing else in the template depends on
the rule.

The comment at the top of the config says so explicitly:

```js
/**
 * Every folder under `src/` publishes its public surface through an `index.ts`
 * barrel, so a deep import into one is an error rather than a convention. Delete
 * the `no-restricted-imports` block below if your project prefers direct imports.
 */
```

If you go further and remove the barrels themselves, delete each `index.ts` and rewrite the imports
that used them. Do it in one commit: a half-migrated codebase has both styles and neither guarantee.
