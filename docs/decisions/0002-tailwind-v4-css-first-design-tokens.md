# ADR-0002 — Tailwind v4 CSS-first with semantic design tokens

## Status

**Accepted** — 2026-07-25

## Context

The template needs a styling system that survives a rebrand, supports dark mode, and does not require
a component author to think about theming at all.

**Tailwind v4 changed where configuration lives.** Through v3, the source of truth was
`tailwind.config.js` — a JavaScript module the build had to load, with a `content` array listing
which files to scan. v4 moves both into CSS: `@theme` declares design tokens as CSS custom
properties, and source detection is automatic. The config file still works for compatibility, but it
is no longer the intended path.

**Dark mode is where most Tailwind codebases accumulate debt.** The conventional approach is a
`dark:` variant on every colour utility:

```html
<div class="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
  <p class="text-zinc-600 dark:text-zinc-400">…</p>
  <button class="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">…</button>
</div>
```

That works, and it has three costs that compound:

1. **Every colour is written twice**, in two places that must be kept consistent by hand. Forget one
   and you get white text on a white background — a bug that only appears for users in one theme,
   which is exactly the kind that survives review.
2. **Component authors carry the theming burden.** Adding a `<Badge>` means knowing the dark palette,
   not just the design.
3. **There is no single place to review the palette.** "What colour is a muted label in dark mode?"
   is answered by grepping the codebase.

**Descriptive names cannot be re-themed.** A token called `--color-zinc-900` is a fact about a
colour, so redefining it for dark mode produces nonsense (`--color-white: black`). A token called
`--color-background` is a fact about a *role*, and redefining it is exactly what dark mode means.

Alternatives considered:

| Option | Why not |
| --- | --- |
| `tailwind.config.js` with a v3-style theme | Works, but it is the legacy path in v4: a JS module in the build, plus a `content` array to keep in sync. Tokens would not be available as CSS variables outside Tailwind. |
| `dark:` variants everywhere | The default, and the source of the three costs above. |
| `prefers-color-scheme` media strategy, no class | Removes the user's ability to override the system setting. A theme toggle is table stakes. |
| CSS Modules or vanilla-extract | Type-safe and scoped, but they give up the utility workflow the rest of the template (and `prettier-plugin-tailwindcss`) is built around. |
| A component library with built-in theming (MUI, Chakra) | A much larger dependency and a much larger opinion than a site template should impose. |

## Decision

We configure Tailwind **entirely in CSS**, with **semantic tokens** in `@theme`, and implement dark
mode by **redefining the same variables** under a `.dark` class. No component contains a `dark:`
class.

There is no `tailwind.config.js`, and adding one would be a step backwards.

Three pieces:

**1. Tokens named by role.**

```css title="src/styles/globals.css"
@import 'tailwindcss';

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.21 0.034 264.665);
  --color-muted: oklch(0.968 0.007 247.896);
  --color-muted-foreground: oklch(0.554 0.046 257.417);
  --color-border: oklch(0.929 0.013 255.508);
  --color-ring: oklch(0.585 0.233 277.117);
  --color-accent: oklch(0.585 0.233 277.117);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.21 0.034 264.665);
  --color-primary-foreground: oklch(0.985 0 0);
}
```

Every token generates its utility family automatically: `--color-accent` yields `bg-accent`,
`text-accent`, `border-accent`, `ring-accent` and the rest. Surfaces always ship with a matching
`-foreground` token, so `bg-accent text-accent-foreground` is guaranteed legible in both themes.

Colours are declared in **OKLCH**, which is perceptually uniform — two colours with the same `L` look
equally bright — making a dark palette that preserves contrast relationships far easier to derive.

**2. A class-based dark variant, with the same names redefined.**

```css
@custom-variant dark (&:is(.dark, .dark *));

.dark {
  --color-background: oklch(0.129 0.042 264.695);
  --color-foreground: oklch(0.984 0.003 247.858);
  /* … the same ten names, different values */
}
```

`bg-background` compiles to `background-color: var(--color-background)`. The utility never changes;
only what the variable resolves to changes, at the point in the tree where `.dark` applies.

**3. `next-themes` sets the class before first paint.**

```tsx title="src/components/providers.tsx"
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
```

It injects a small blocking script that reads `localStorage` (falling back to the system preference)
and applies the class before React hydrates — which is what prevents the flash of the wrong theme.
`<html>` carries `suppressHydrationWarning` because that script legitimately mutates the element
before hydration.

The variant is still declared, so `dark:` is available for a genuine exception. Reaching for it is a
signal that a token is missing.

## Consequences

### Positive

- **Dark mode is ten variables, not two hundred classes.** The entire dark palette is one reviewable
  block. A designer can change it without touching a component.
- **Component authors never think about theming.** `bg-accent text-accent-foreground` is correct in
  both themes by construction. There is no second class to forget.
- **A rebrand is a diff in one file for everything the browser renders.** Change `--color-accent` and
  every call to action, focus ring and link follows. The generated images are the exception: Satori
  resolves neither CSS variables nor `oklch()`, so `icon.tsx`, `apple-icon.tsx` and
  `opengraph-image.tsx` repeat the palette as literal hex.
- **Tokens exist outside Tailwind.** They are real CSS custom properties on `:root`, usable from an
  inline style, a third-party widget, or anywhere the utility classes are not.
- **Adding a token requires no restart and no config edit.** Write `--color-warning` in `@theme` and
  `bg-warning` exists on the next build.
- **Less markup.** Class lists are roughly half the length of the `dark:`-variant equivalent, which
  materially improves the readability of a component.
- **The system is self-policing.** "I need a `dark:` class here" is an unambiguous signal that the
  token vocabulary is incomplete — a much clearer prompt than "this colour looks wrong at night".

### Negative

- **Semantic naming requires up-front design.** You must decide that a thing is a "muted foreground"
  before you can style it. With `text-zinc-500` you decide nothing and move on. For a one-off page
  that is genuinely slower.
- **Indirection when debugging.** DevTools shows `background-color: var(--color-background)`, and
  finding the actual value means following the variable. Marginally more friction than a literal.
- **The token set can become a straitjacket.** A design that needs eleven greys does not fit ten
  semantic names, and the escape valves — adding tokens or reaching for a raw palette colour — both
  weaken the system if used casually.
- **Non-colour theming is not covered.** Shadows, image treatments and SVG assets that need to differ
  between themes still require a `dark:` variant or a separate mechanism. The rule is "no `dark:` for
  colour", not "no `dark:` ever".
- **`next-themes` is a runtime dependency and a client boundary.** It is small, but it pulls
  `Providers` into the client bundle and adds a blocking inline script — which in turn is part of why
  the CSP needs `'unsafe-inline'` in `script-src`.
- **v4 knowledge is thinner than v3 knowledge.** Most Tailwind answers online — and much of what an
  AI assistant will suggest — assume `tailwind.config.js`. Expect to correct advice that tells you to
  create one.
- **A theme flash is possible if the setup is broken.** Remove `suppressHydrationWarning`, or move
  `Providers` out of the root layout, and the white flash returns. The failure mode is subtle and
  only visible on a cold load in dark mode.

### Neutral

- The `dark` variant remains declared and usable — this is a convention, not a lockout.
- `prettier-plugin-tailwindcss` sorts utilities on save and on commit, so class order is never a
  review topic.
- `ThemeToggle` adds a `.theme-transition` class to `<html>` for the duration of a switch, which
  crossfades colours over 250 ms, and the base layer honours `prefers-reduced-motion`.

## Revisit if

- The design requires more than a dozen or so semantic colour roles, at which point a generated token
  scale (from a design tool) beats a hand-maintained block.
- Multiple themes beyond light/dark are needed — brand themes, high contrast. The mechanism extends
  (`.theme-brand { … }`), but the naming needs a rethink first.
- Tailwind changes the `@theme` contract in a future major.
- Theming has to cover more than colour — shadows, illustrations, per-theme imagery.

## Opting out

**To use `dark:` variants instead:** the variant is already declared, so nothing needs enabling. Move
your palette out of the `.dark` block into ordinary descriptive tokens and write `dark:` classes as
usual. You lose the single-block palette review; you gain per-element control.

**To go back to a JS config:** create `tailwind.config.js` and import it with
`@config "../../tailwind.config.js";` in `globals.css`. Supported in v4, but you take on the
`content` array and lose the CSS-variable availability.

**To drop the theme toggle entirely:** remove `next-themes`, `Providers` and `ThemeToggle`, and
change `@custom-variant dark` to the media strategy:

```css
@custom-variant dark (@media (prefers-color-scheme: dark));
```

Then move the `.dark` overrides into a `@media (prefers-color-scheme: dark) { :root { … } }` block.
The site follows the operating system and users can no longer override it — a legitimate trade for a
simple landing page.
