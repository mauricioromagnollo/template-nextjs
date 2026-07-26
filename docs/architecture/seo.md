# SEO & Metadata

Everything a crawler or a social platform reads is generated from `src/config/site/site-config.ts`.
There is no hard-coded URL anywhere in the metadata path, which is what lets a preview deploy
advertise itself correctly instead of pointing at production.

## `buildMetadata()`

`src/lib/seo.ts` exports a helper that produces a Next.js `Metadata` object with sensible defaults,
so a page only declares what makes it different:

```ts title="src/lib/seo.ts (shape)"
export type BuildMetadataInput = {
  /** Page title. Omit it on the home page to use the bare site name. */
  title?: string
  description?: string
  /** Path used for the canonical and Open Graph URLs. */
  path?: string
  /** Absolute URL or site-relative path to the social card image. */
  image?: string
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata
```

Used from the root layout, where it also sets the title template:

```tsx title="src/app/layout.tsx"
import { buildMetadata } from '@/lib'

export const metadata = buildMetadata()
```

and from any page that needs its own:

```tsx title="src/app/about/page.tsx"
export const metadata = buildMetadata({
  title: 'About',
  description: 'Who builds this and why.',
  path: '/about',
})
```

What it fills in:

| Field | Value |
| --- | --- |
| `metadataBase` | `new URL(SITE_URL)`, where `SITE_URL` is `siteConfig.url` |
| `title` | A plain string, not a template: bare `siteConfig.name` when `title` is omitted, otherwise the page title, a pipe separator and `siteConfig.name` |
| `description` | `input.description ?? siteConfig.description` |
| `alternates.canonical` | `absoluteUrl(input.path ?? '/')` |
| `openGraph` | `type`, `siteName`, `locale`, `url`, `title`, `description`, `images` (with `width`/`height` from `OG_SIZE`) |
| `twitter` | `card: 'summary_large_image'`, title, description, images |
| `robots` | `{ index: true, follow: true }` |
| `applicationName`, `authors`, `creator` | From `siteConfig` |

!!! note "Excluding a page from the index"

    `buildMetadata` has no `noIndex` switch. A route that must not be indexed overrides the field
    itself: `export const metadata = { ...buildMetadata({ … }), robots: { index: false, follow: false } }`.

### `metadataBase` and canonical URLs

`metadataBase` is the origin Next.js resolves every relative metadata URL against. Without it,
`alternates.canonical: '/about'` emits a relative canonical (which crawlers treat inconsistently) and
Next logs a build-time warning.

With it, one relative path produces all three absolute forms:

```html
<link rel="canonical" href="https://example.com/about" />
<meta property="og:url" content="https://example.com/about" />
<meta property="og:image" content="https://example.com/opengraph-image" />
```

Because `siteConfig.url` comes from `NEXT_PUBLIC_SITE_URL`, the value is correct per environment
without a code change.

!!! warning "Set it in production"

    A trailing slash is harmless — `normalizeUrl()` in `src/config/environment/environment.ts` strips
    it before anything composes a URL, which is what lets `absoluteUrl()` use plain concatenation.
    What is not harmless is leaving the variable unset: reading it falls back to
    `http://localhost:3000`, so every canonical tag, Open Graph URL and sitemap entry in production
    would point at localhost — exactly the kind of mistake that is invisible until a search console
    report shows up weeks later.

---

## Open Graph and Twitter cards

Both are produced from the same inputs, so they cannot drift:

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Next.js Template" />
<meta property="og:locale" content="en_US" />
<meta property="og:title" content="About | Next.js Template" />
<meta property="og:description" content="Who builds this and why." />
<meta property="og:url" content="https://example.com/about" />
<meta property="og:image" content="https://example.com/opengraph-image" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="About | Next.js Template" />
<meta name="twitter:description" content="Who builds this and why." />
<meta name="twitter:image" content="https://example.com/opengraph-image" />
```

`summary_large_image` is the card type that renders the 1200×630 image at full width. The smaller
`summary` card is the default when you omit it, and it looks like an afterthought.

!!! tip "Test before you launch"

    Paste the URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
    and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/). Both cache aggressively,
    so scrape once *after* the domain is final — otherwise you will be fighting a stale preview for
    days.

---

## Generated images

Three App Router file conventions generate images at build time using
[`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response), which renders
a subset of JSX/CSS with Satori and rasterises it:

| File | Route | Size |
| --- | --- | --- |
| `src/app/icon.tsx` | `/icon` | 32×32 PNG |
| `src/app/apple-icon.tsx` | `/apple-icon` | 180×180 PNG |
| `src/app/opengraph-image.tsx` | `/opengraph-image` | 1200×630 PNG |

```tsx title="src/app/opengraph-image.tsx"
import { ImageResponse } from 'next/og'

import { siteConfig } from '@/config/site'
import { OG_CONTENT_TYPE, OG_SIZE, truncateOgTitle } from '@/lib'

// Literal hex: Satori resolves neither CSS variables nor oklch.
const BACKGROUND = '#020617'
const FOREGROUND = '#f8fafc'

export const size = OG_SIZE // { width: 1200, height: 630 }
export const contentType = OG_CONTENT_TYPE // 'image/png'
export const alt = siteConfig.name

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: BACKGROUND,
        color: FOREGROUND,
      }}
    >
      <div style={{ fontSize: 68, fontWeight: 700 }}>{truncateOgTitle(siteConfig.name)}</div>
      <div style={{ fontSize: 30 }}>{truncateOgTitle(siteConfig.description, 110)}</div>
    </div>,
    size
  )
}
```

`src/lib/og.ts` holds what the three routes share — `OG_SIZE`, `OG_CONTENT_TYPE`,
`OG_TITLE_MAX_LENGTH` and `truncateOgTitle()` — so the cards stay dimensionally consistent and long
titles cannot overflow the safe area.

!!! warning "Colours are literal hex inside the image routes, not tokens"

    Satori resolves neither CSS custom properties nor `oklch()`, so each route declares its own hex
    constants (`#4f46e5` for the icons, the slate/indigo pair above for the social card). A rebrand
    therefore means editing `src/styles/globals.css` **and** those constants — `og.ts` exports no
    colours to keep in sync.

!!! warning "Satori is not a browser"

    `ImageResponse` supports a subset of CSS. Flexbox works; CSS Grid does not. Every element with
    more than one child needs an explicit `display: 'flex'`. Tailwind classes are not available —
    write inline styles. And keep it simple: this markup runs on every build.

### Prefer static files instead?

Delete the three route files and drop `icon.png`, `apple-icon.png` and `opengraph-image.png` into
`src/app/`. The App Router picks them up by filename with no other change. You trade "always matches
the current title and brand colour" for "exactly the pixels a designer approved" — both are
defensible.

---

## `sitemap.ts`

```ts title="src/app/sitemap.ts"
import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib'

/** Every indexable route. Add new pages here as the site grows. */
const STATIC_ROUTES = ['/']

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 1,
  }))
}
```

Served at `/sitemap.xml`. The list is explicit rather than derived from `siteConfig.navigation`:
the navigation entries are in-page anchors (`/#features`, `/#stack`, `/#getting-started`) plus
external links, and neither belongs in a sitemap that is supposed to enumerate the routes of *this*
origin.

When you add a route that should be indexed, add its path to `STATIC_ROUTES`. `absoluteUrl()` from
`src/lib/seo.ts` resolves it against `siteConfig.url`, so the sitemap is correct per environment
without a code change.

!!! note "Dynamic content"

    For a blog, `sitemap()` may be `async` and read from wherever your posts live:

    ```ts
    export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
      const posts = await getPosts()
      return [...staticEntries, ...posts.map(toSitemapEntry)]
    }
    ```

---

## `robots.ts`

```ts title="src/app/robots.ts"
import type { MetadataRoute } from 'next'

import { SITE_URL, absoluteUrl } from '@/lib'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
```

Served at `/robots.txt`. The shipped rule allows everything, and the `sitemap`/`host` values follow
`NEXT_PUBLIC_SITE_URL`, so a preview deploy advertises its own origin rather than production's.

!!! warning "Previews are allowed by default — gate them yourself"

    **Preview deployments must not be indexed:** two copies of the same content on two domains is the
    textbook way to compete with yourself in search results. The template relies on Vercel's
    deployment protection for that, but if your previews are public, branch on the environment:

    ```ts
    import { environment } from '@/config/environment'

    const isProduction = environment.appEnv === 'production'

    rules: [{ userAgent: '*', ...(isProduction ? { allow: '/' } : { disallow: '/' }) }],
    ```

    `APP_ENV` is the flag to read — not `NODE_ENV`, which Next sets to `production` for every build.

!!! warning "`robots.txt` is a request, not a control"

    Well-behaved crawlers obey it; nothing else does. It is also not a security boundary — a
    `Disallow` line advertises the path to anyone who reads the file. Use authentication for private
    content, and Vercel's deployment protection for previews.

---

## JSON-LD structured data

Structured data tells search engines what a page *is* rather than what it says. The template emits a
single `WebSite` node — with the author nested as a `Person` — from the root layout:

```tsx title="src/app/layout.tsx (excerpt)"
import { buildWebSiteJsonLd, serializeJsonLd } from '@/lib'

// ...
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildWebSiteJsonLd()) }}
/>
```

`buildWebSiteJsonLd()` lives in `src/lib/seo.ts` and returns the typed `WebSiteJsonLd` shape:
`name`, `description`, `url`, `inLanguage` and `author`, all read from `siteConfig`.

### Why `serializeJsonLd` exists

`dangerouslySetInnerHTML` is unavoidable here — React escapes text nodes, which would corrupt the
JSON — so the escaping has to be done deliberately:

```ts title="src/lib/sanitize.ts (excerpt)"
/**
 * Serializes a JSON-LD payload for `<script type="application/ld+json">`.
 * Escaping `<` prevents a string value containing `</script>` from closing the
 * tag early and turning content into markup.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
```

The values here come from `siteConfig`, which is checked into the repository — but a template gets
copied, and the first thing people do is feed it CMS content. The escape costs one `replace` call and
closes an XSS vector permanently.

The replacement is a standard JSON unicode escape, so `JSON.parse` on the consumer side yields the
original `<` back. Nothing is lost, and the crawler sees exactly what you meant.

### Verifying it

Run the deployed URL through Google's
[Rich Results Test](https://search.google.com/test/rich-results) and
[Schema.org validator](https://validator.schema.org/). Invalid structured data is worse than none —
Google may ignore the whole node.

---

## Checklist for a new page

- [ ] `export const metadata = buildMetadata({ title, description, path })` — with `path` set, or the
      canonical URL will point at `/`.
- [ ] A unique `description`. Duplicated descriptions across pages are a ranking problem.
- [ ] Exactly one `<h1>`, and it should say roughly what the `title` says.
- [ ] The route added to `STATIC_ROUTES` in `src/app/sitemap.ts` if it belongs in the sitemap, and to
      `siteConfig.navigation` if it belongs in the header.
- [ ] `robots: { index: false, follow: false }` spread over `buildMetadata()` for anything that must
      not be indexed (thank-you pages, staging-only routes).
- [ ] Images through `next/image`, with real `alt` text.
- [ ] After deploying: check `/sitemap.xml` and `/robots.txt` in a browser.
