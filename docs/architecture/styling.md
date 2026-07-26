# Styling

Tailwind CSS 4, configured entirely in CSS. There is no `tailwind.config.js` in this repository and
adding one would be a step backwards.

## How Tailwind v4 is wired up

The whole build is one PostCSS plugin:

```js title="postcss.config.mjs"
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

And one CSS file, imported once from the root layout:

```css title="src/styles/globals.css"
@import 'tailwindcss';

@custom-variant dark (&:is(.dark, .dark *));

@theme {
  /* tokens — see below */
}

@layer base {
  /* element defaults */
}
```

That is the entire configuration surface. Tailwind scans your source files automatically; there is
no `content` array to keep in sync, and no JavaScript config to reason about.

---

## `@theme` and how tokens become utilities

`@theme` declares CSS custom properties in a namespace Tailwind understands. Each namespace prefix
generates a family of utilities:

| Prefix | Example token | Utilities you get |
| --- | --- | --- |
| `--color-*` | `--color-accent` | `bg-accent`, `text-accent`, `border-accent`, `ring-accent`, `fill-accent`, `divide-accent`, … |
| `--font-*` | `--font-sans` | `font-sans` |
| `--container-*` | `--container-content` | `max-w-content`, `w-content`, … |
| `--radius-*` | `--radius-card` | `rounded-card` |
| `--spacing-*` | `--spacing-gutter` | `p-gutter`, `m-gutter`, `gap-gutter`, … |
| `--breakpoint-*` | `--breakpoint-3xl` | the `3xl:` variant |
| `--text-*` | `--text-hero` | `text-hero` |
| `--shadow-*` | `--shadow-card` | `shadow-card` |

Only the first three namespaces are in use today: the template ships `--color-*`, `--font-*` and a
single `--container-*` token. The rest of the table is what becomes available the moment you declare
one.

Declaring the variable *is* the configuration step. Add `--color-warning` to `@theme` and
`bg-warning` exists on the next build, with no restart and no config edit.

Tokens are also emitted as real CSS variables on `:root`, so they are available outside Tailwind —
in an inline style, in a third-party widget, or in `ImageResponse` markup.

### The token set

```css title="src/styles/globals.css"
@theme {
  /* Typography — the two variables come from next/font in the root layout */
  --font-sans: var(--font-sans-google), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-google), ui-monospace, SFMono-Regular, monospace;

  /* Reading width of the page shell; drives `max-w-content`. */
  --container-content: 1120px;

  /* Surfaces */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.21 0.034 264.665);

  /* De-emphasised content */
  --color-muted: oklch(0.968 0.007 247.896);
  --color-muted-foreground: oklch(0.554 0.046 257.417);

  /* Lines */
  --color-border: oklch(0.929 0.013 255.508);
  --color-ring: oklch(0.585 0.233 277.117);

  /* Actions */
  --color-accent: oklch(0.585 0.233 277.117);
  --color-accent-foreground: oklch(0.985 0 0);

  --color-primary: oklch(0.21 0.034 264.665);
  --color-primary-foreground: oklch(0.985 0 0);
}
```

That is the complete set: ten colours, two font stacks and one container width. There is no
`--color-card` and no `--radius-*` token — `Card` is a `border-border` panel on the page background
with a plain `rounded-xl`, and a shape token only earns its place once two components disagree about
the value.

Two naming rules make the whole system work:

1. **Semantic, not descriptive.** `--color-accent`, not `--color-indigo-600`. The name says what it
   is *for*, so redefining it for dark mode is coherent rather than absurd (`--color-white: black`
   is absurd).
2. **`X` and `X-foreground` travel together.** Every surface token has a matching foreground token
   with guaranteed contrast, so `bg-accent text-accent-foreground` is always legible in both themes.

!!! note "Why OKLCH"

    OKLCH is perceptually uniform: two colours with the same `L` look equally bright to a human,
    which hex and HSL cannot promise. That makes it far easier to build a dark palette that keeps the
    same contrast relationships, and it unlocks the P3 gamut on displays that support it. All modern
    browsers support it.

---

## Dark mode without a single `dark:` class

Three pieces.

### 1. The variant

```css
@custom-variant dark (&:is(.dark, .dark *));
```

This tells Tailwind that "dark" means *inside an element carrying the `.dark` class* — class
strategy, not `prefers-color-scheme`. The template does define the variant, because Tailwind needs it
for the rare case you reach for it, but **no component uses it**.

### 2. The override block

```css
.dark {
  --color-background: oklch(0.129 0.042 264.695);
  --color-foreground: oklch(0.984 0.003 247.858);

  --color-muted: oklch(0.208 0.042 265.755);
  --color-muted-foreground: oklch(0.704 0.04 256.788);

  --color-border: oklch(0.279 0.041 260.031);
  --color-ring: oklch(0.673 0.182 276.935);

  --color-accent: oklch(0.673 0.182 276.935);
  --color-accent-foreground: oklch(0.129 0.042 264.695);

  --color-primary: oklch(0.984 0.003 247.858);
  --color-primary-foreground: oklch(0.208 0.042 265.755);
}
```

Same variable names, different values. `bg-background` compiles to
`background-color: var(--color-background)`, so the utility never changes — only what the variable
resolves to, at the point in the tree where `.dark` applies.

### 3. `next-themes`

`components/providers.tsx` mounts the provider that puts `.dark` on `<html>`:

```tsx title="src/components/providers.tsx"
'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
```

`next-themes` injects a tiny blocking script that reads `localStorage` (falling back to the system
preference) and sets the class *before* first paint, which is what prevents the white flash. The root
layout carries `suppressHydrationWarning` on `<html>` because that script legitimately mutates the
element before React hydrates it.

`ThemeToggle` in `components/ui/` is the only component that calls `useTheme()`.

!!! tip "The payoff"

    Two hundred `dark:` classes across a codebase are two hundred chances to forget one. Ten
    variables in one block are ten values a designer can review at a glance — and a component author
    never has to think about dark mode at all.

---

## `.theme-transition`

Switching theme flips every colour at once, which reads as a jarring snap. A single class smooths it:

```css title="src/styles/globals.css"
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition:
    background-color 250ms ease,
    border-color 250ms ease,
    color 250ms ease,
    fill 250ms ease,
    stroke 250ms ease;
}
```

It is **not** applied permanently. `ThemeToggle` adds the class to `<html>`, calls `setTheme()`, and
removes it 300 ms later — slightly longer than the CSS transition so the fade never gets cut off.
Three details are deliberate:

- **The class is temporary.** Transitioning colours all the time makes the first paint fade in and
  drags every hover state, so the animation exists only for the duration of the swap.
- **The property list is explicit.** `transition: all` would also animate `transform` and `opacity`,
  fighting every other animation on the page.
- **`disableTransitionOnChange` *is* used** on the provider. That flag suppresses `next-themes`' own
  transition blocker, leaving `ThemeToggle` as the single thing driving the animation. If you prefer
  an instant switch, drop the class from the toggle rather than the flag.

### `prefers-reduced-motion`

Motion is opt-out at the base layer, for the transition above and for everything else:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The durations go to `0.01ms` rather than `0` so that `transitionend`/`animationend` handlers still
fire — a transition of exactly zero never fires them in some browsers, and code that waits for the
event hangs.

!!! warning "This is an accessibility requirement, not a nicety"

    Vestibular disorders make large-area motion genuinely painful. WCAG 2.1 success criterion 2.3.3
    covers it. Do not remove this block, and do not add animations that ignore it.

---

## Adding or changing a token

=== "Add a new colour"

    1. Add the light value to `@theme`:

       ```css
       @theme {
         --color-warning: oklch(0.78 0.15 82);
         --color-warning-foreground: oklch(0.21 0.006 285.9);
       }
       ```

    2. Add the dark value to the `.dark` block — **always both**, or the colour will be wrong in one
       theme:

       ```css
       .dark {
         --color-warning: oklch(0.72 0.14 82);
         --color-warning-foreground: oklch(0.141 0.005 285.8);
       }
       ```

    3. Use `bg-warning text-warning-foreground`. No restart required.

=== "Rebrand"

    Change the values of `--color-accent` / `--color-accent-foreground` (and their `.dark`
    counterparts). Because every call to action, focus ring and link uses the token, the whole site
    follows.

    The one place that does **not** follow is the generated imagery. Satori resolves neither CSS
    variables nor `oklch()`, so `src/app/icon.tsx`, `src/app/apple-icon.tsx` and
    `src/app/opengraph-image.tsx` each declare literal hex constants. Update those by hand —
    `src/lib/og.ts` exports sizing and title truncation only, no colours.

=== "Change the type scale"

    Add `--text-*` tokens:

    ```css
    @theme {
      --text-hero: 3.5rem;
      --text-hero--line-height: 1.05;
      --text-hero--letter-spacing: -0.02em;
    }
    ```

    Then use `text-hero`. The `--*--line-height` and `--*--letter-spacing` sub-tokens ride along with
    the utility.

=== "Remove a token"

    Delete it from `@theme` **and** from `.dark`, then run `npm run lint` and grep for the utility
    name. Tailwind silently emits nothing for an undefined utility, so a missed usage shows up as
    unstyled markup rather than as an error — grep is the check.

---

## Rules of thumb

- **Never write a `dark:` class.** If you need one, add a token instead.
- **Never write a raw palette colour** (`bg-zinc-900`, `text-white`). Same reason.
- **Never write arbitrary values for colours** (`bg-[#0f172a]`). Arbitrary values for one-off
  *geometry* (`mt-[3px]`) are acceptable; colours are not.
- **Merge incoming `className` last, through `cn()`** — see
  [Conventions](conventions.md#compose-classes-with-cn).
- **Let the plugin sort your classes.** `prettier-plugin-tailwindcss` rewrites class order on save
  and on commit; hand-ordering is wasted effort.

The reasoning behind this whole approach is recorded in
[ADR 0002](../decisions/0002-tailwind-v4-css-first-design-tokens.md).
