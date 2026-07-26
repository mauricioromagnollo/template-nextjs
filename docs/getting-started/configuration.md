# Configuration

Everything you need to change to turn the template into *your* project, in the order you should
change it.

## 1. Site configuration

`src/config/site/site-config.ts` is the single source of truth for identity: it feeds the metadata
helper, the header and footer, the sitemap and `robots.txt`. Change it once and the whole site
follows.

```ts title="src/config/site/site-config.ts"
export const siteConfig: SiteConfig = {
  name: environment.siteName, // (1)!
  description:
    'An opinionated, production-ready Next.js template with 100% test coverage, end-to-end tests, Docker and CI/CD wired up from the first commit.',
  url: environment.siteUrl, // (2)!
  locale: 'en_US',
  author: {
    name: 'Maurício Romagnollo',
    url: 'https://github.com/mauricioromagnollo',
  },
  links: {
    github: 'https://github.com/mauricioromagnollo/template-nextjs',
    linkedin: 'https://www.linkedin.com/in/mauricioromagnollo',
    x: 'https://x.com/mauriciormgnl',
  },
  navigation: [
    { href: '/#features', label: 'Features' },
    { href: '/#stack', label: 'Stack' },
    { href: '/#getting-started', label: 'Getting started' },
  ],
}
```

1.  The name comes from `NEXT_PUBLIC_SITE_NAME`, falling back to `Next.js Template`.
2.  The URL is **not** hard-coded either. It comes from `NEXT_PUBLIC_SITE_URL` through the
    environment module, so a preview deploy advertises the preview origin and production advertises
    the real one.

| Field | Used by |
| --- | --- |
| `name` | `metadata.applicationName`, the suffix on every page title, the header, the footer, JSON-LD and the generated images |
| `description` | `<meta name="description">`, Open Graph and Twitter descriptions, JSON-LD |
| `url` | `metadataBase`, canonical URLs, `sitemap.xml`, `robots.txt` |
| `locale` | `og:locale` |
| `author` | JSON-LD `author`, the `authors` and `creator` metadata fields |
| `navigation` | `<NavLinks>` in the header |
| `links` | Footer social icons and the landing page call to action |

!!! note "`navigation` is not the sitemap"

    The shipped navigation entries are in-page anchors (`/#features`, `/#stack`,
    `/#getting-started`), so `sitemap.ts` keeps its own explicit `STATIC_ROUTES` list instead of
    deriving one from `navigation`. Adding a real route means touching both — see
    [SEO & Metadata](../architecture/seo.md#sitemapts).

!!! warning "`SiteConfig` is a typed contract"

    `site-config.ts` declares a `SiteConfig` type next to the object. Adding a field means adding it
    to the type first; the object is not `as const`, so a typo is a compile error rather than a
    silently-undefined value at runtime.

---

## 2. Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | No | `Next.js Template` | Display name used in metadata and the UI. Inlined into the client bundle. |
| `NEXT_PUBLIC_SITE_URL` | **In production** | `http://localhost:3000` | Canonical origin, no trailing slash. Drives `metadataBase`, canonical tags, Open Graph URLs, `sitemap.xml` and `robots.txt`. Inlined into the client bundle. |
| `APP_ENV` | No | `development` | One of `development \| test \| production`. Server-only. Validated and typed, but not read by any shipped route yet — it is the hook for behaviour that should differ per deployment (indexing rules, feature flags, verbose logging). |
| `PORT` | No | `3000` | Port for `npm run start`, the container and the Playwright base URL. Not read by the Next dev server — use `--port` for that. |

Copy the reference file and edit it:

```bash
cp .env.example .env
```

!!! danger "`NEXT_PUBLIC_` means public"

    Next replaces every `process.env.NEXT_PUBLIC_*` reference with a string literal at build time,
    including in code that ships to the browser. Anyone can read it in DevTools. Never put an API
    key, token or database URL behind that prefix — and remember that rebuilding is the only way to
    change one. See the [environment variable reference](../reference/environment-variables.md).

---

## 3. Design tokens

There is no `tailwind.config.js`. Tailwind 4 is configured in CSS, inside the `@theme` block of
`src/styles/globals.css`:

```css title="src/styles/globals.css (excerpt)"
@import 'tailwindcss';

@custom-variant dark (&:is(.dark, .dark *));

@theme {
  --font-sans: var(--font-sans-google), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-google), ui-monospace, SFMono-Regular, monospace;

  --container-content: 1120px;

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

Every token becomes a utility automatically: `--color-accent` gives you `bg-accent`, `text-accent`,
`border-accent`, `ring-accent` and the rest, with no configuration step.

Dark mode overrides the same variable names under `.dark`, which is why **no component in this
template contains a `dark:` class**. Read [Styling](../architecture/styling.md) before changing
colours — the token naming is what makes that work.

### Fonts

Two families are loaded with `next/font` in `src/app/layout.tsx` and exposed to CSS as variables:

```tsx title="src/app/layout.tsx (excerpt)"
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-google',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-google',
})

// ...
<html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetBrainsMono.variable}`}>
```

The `variable` names are deliberately generic (`--font-sans-google`, not `--font-inter`), so swapping
the typeface is a one-line import change: `@theme` keeps pointing `--font-sans` at the same variable.
`next/font` self-hosts the files, so there is no request to a font CDN and no CSP change needed.

### Favicon and social image

These are **generated**, not stored as files:

| Route | Output | Source |
| --- | --- | --- |
| `/icon` | 32×32 PNG favicon | `src/app/icon.tsx` |
| `/apple-icon` | 180×180 touch icon | `src/app/apple-icon.tsx` |
| `/opengraph-image` | 1200×630 social card | `src/app/opengraph-image.tsx` |

Each uses `ImageResponse` with the shared sizing and title-truncation helpers from `src/lib/og.ts`.
Colours are **not** shared: Satori resolves neither CSS variables nor `oklch()`, so each route
declares its own hex constants and a rebrand means editing all three. If you would rather ship static
files, delete these routes and drop `icon.png` / `apple-icon.png` / `opengraph-image.png` into
`src/app/` — the App Router picks them up by filename. See
[SEO & Metadata](../architecture/seo.md#generated-images).

---

## 4. `next.config.ts`

The one field most projects need to touch is `images.remotePatterns`. It is an empty allow-list, and
`next/image` refuses any host that is not in it:

```ts title="next.config.ts (with two hosts added)"
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { protocol: 'https', hostname: 'images.example.com' },
    { protocol: 'https', hostname: '**.cdn.example.com' },
  ],
},
```

!!! warning "Remote images also need a CSP entry"

    `remotePatterns` is a Next.js check. The browser applies `img-src` from the
    Content-Security-Policy in `src/lib/security-headers.ts` independently. Add the host in both
    places — see [Security](../architecture/security.md#extending-the-csp).

The other two blocks — `output: 'standalone'` and `headers()` — should stay as they are unless you
know why you are changing them ([ADR 0004](../decisions/0004-standalone-output-and-docker.md)).

---

## 5. Rename this template

Search the repository for `template-nextjs` and `mauricioromagnollo` and work through this list.
None of it is optional if the project is going to be public.

- [ ] **`package.json`** — `name`, `version` (start at `0.1.0`), `description`, `author`,
      `repository.url`, `bugs.url`, `homepage`.
- [ ] **`LICENSE`** — keep MIT if you like, but replace the copyright holder with your name and the
      current year. Removing the file is not the same as choosing a licence.
- [ ] **`README.md`** — rewrite it for your project. The template's README describes the template.
- [ ] **`.github/CODEOWNERS`** — replace `@mauricioromagnollo` with your user or team, otherwise
      review requests go to a stranger.
- [ ] **`.github/FUNDING.yml`** — update the sponsor handles or delete the file.
- [ ] **`.github/dependabot.yml`** — set `reviewers`/`assignees` to your account.
- [ ] **`src/config/site/site-config.ts`** — description, author, `navigation`, `links`. The `name`
      comes from `NEXT_PUBLIC_SITE_NAME`, so change that in `.env` / your host instead.
- [ ] **`.env.example`** — update the default `NEXT_PUBLIC_SITE_NAME`, and commit it.
- [ ] **`mkdocs.yml`** — `site_name`, `site_description`, `site_author`, `site_url`, `repo_url`,
      `repo_name`, `copyright` and the `extra.social` links. `site_url` must match your GitHub Pages
      URL, or the sitemap and canonical tags in the docs will point at the template.
- [ ] **`docs/`** — the decision records describe *this* template's trade-offs. Keep the ones you
      agree with, rewrite the ones you do not, delete the rest — and update `nav:` accordingly,
      because the docs build runs with `--strict`.
- [ ] **Workflows** — `deploy-preview.yml` and `deploy-production.yml` need `VERCEL_TOKEN`,
      `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as repository secrets before they do anything. See
      [Deployment](../guides/deployment.md).
- [ ] **GitHub Pages** — Settings :material-arrow-right: Pages :material-arrow-right: Source:
      **GitHub Actions**, or `publish-docs.yml` will fail on its first run.
- [ ] **Branch protection** — require the `CI` checks on `main` once the first run is green.
- [ ] **Docker image name** — the `Makefile` tags `template-nextjs:latest`; rename it if you push to
      a registry.

!!! tip "Verify with a full run"

    ```bash
    make check && make test-e2e && make docs-build
    ```

    If those three pass after your renaming pass, nothing structural is broken.
