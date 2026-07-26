# Security

A static marketing site is not a high-value target, but it is an easy one: a stolen npm token, an
unescaped string, or a missing header is enough to serve someone else's JavaScript from your domain.
The template closes the cheap holes by default.

## Response headers

`src/lib/security-headers.ts` exports `buildSecurityHeaders()`, a pure function returning
`{ key, value }` pairs. `next.config.ts` applies them to every route:

```ts title="next.config.ts (excerpt)"
async headers() {
  return [
    {
      source: '/(.*)',
      headers: buildSecurityHeaders(),
    },
  ]
},
```

Keeping the logic in `lib/` rather than inline in the config has one concrete payoff: the function
can be asserted in a unit test without booting a server, which is how it reaches the coverage floor
along with everything else.

Verify what is actually being sent:

```bash
curl -sI http://localhost:3000 | grep -Ei 'content-security|x-frame|x-content|referrer|permissions'
```

### Content-Security-Policy

The most important header, and the only one with real configuration cost. It tells the browser which
origins may supply each resource type; anything else is blocked outright.

The policy is built by a function rather than declared as a constant, because one directive pair has
to differ between development and production:

```ts title="src/lib/security-headers.ts (excerpt)"
export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  // Next.js hydration and next-themes' pre-paint script are inline; Vercel
  // Analytics and Speed Insights load their script from va.vercel-scripts.com.
  const scriptSrc = ["'self'", "'unsafe-inline'", VERCEL_SCRIPT_ORIGIN]
  const connectSrc = ["'self'", ...VERCEL_INSIGHTS_ORIGINS]

  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'")
    // Turbopack's hot-reload channel.
    connectSrc.push('ws:')
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    // Tailwind emits a stylesheet, but next/font and React style props inline.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': connectSrc,
    'manifest-src': ["'self'"],
    // Clickjacking, plugin and injected-<base> protection.
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}
```

| Directive | What it does here |
| --- | --- |
| `default-src 'self'` | The fallback for anything not listed: same origin only. |
| `script-src` | Where JavaScript may come from. The single most valuable directive — it is what turns an injected `<script src="https://evil.tld/x.js">` into a console error. `'unsafe-eval'` is added **only** when `isDevelopment`, for React Refresh. |
| `style-src` | Same, for stylesheets. |
| `img-src 'self' data: blob: https:` | `data:` covers inlined SVGs and the generated icons; `blob:` covers client-generated previews; `https:` keeps `next/image` working with any remote host you allow in `next.config.ts`. |
| `font-src 'self' data:` | `next/font` self-hosts, so no CDN entry is needed. |
| `connect-src` | Restricts `fetch`, XHR, WebSocket and `sendBeacon` targets — the exfiltration channel an injected script would use. Allows the two Vercel telemetry origins, plus `ws:` in development. |
| `manifest-src 'self'` | A web app manifest may only come from your own origin. |
| `frame-ancestors 'none'` | Nobody may embed this site in an iframe. The modern, more expressive replacement for `X-Frame-Options`. |
| `object-src 'none'` | Kills `<object>`/`<embed>`/Flash-era plugin vectors. There is no legitimate use. |
| `base-uri 'self'` | Stops an injected `<base href>` from silently re-pointing every relative URL on the page. |
| `form-action 'self'` | Stops an injected form from posting your users' input to another origin. |

!!! note "`img-src https:` is deliberately broad"

    Narrowing it to specific hosts is a strict improvement once you know which hosts you use. It is
    wide here so that adding an image CDN does not silently break the page in a template most people
    will point at their own assets on day one.

!!! warning "`'unsafe-inline'` in `script-src` is a real, acknowledged weakening"

    It is there because Next.js injects inline bootstrap scripts and `next-themes` injects a
    pre-paint script, and neither carries a nonce that a static header could match. Removing it
    requires generating a per-request nonce in middleware and threading it through — worthwhile for
    an application handling user data, overkill for a marketing site.

    Note that CSP is defence in *depth*. It limits the blast radius of an injection; it is not a
    substitute for not injecting.

### `X-Frame-Options: DENY`

Prevents the page from being rendered in a frame, which blocks clickjacking — an attacker overlaying
your site under a transparent frame and harvesting the clicks.

`frame-ancestors 'none'` already covers this for every browser released in the last several years.
`X-Frame-Options` stays because it costs one line and is honoured by older clients and some corporate
proxies. When the two disagree, `frame-ancestors` wins in modern browsers.

### `X-Content-Type-Options: nosniff`

Tells the browser to trust the declared `Content-Type` instead of guessing from the bytes. Without
it, a file you serve as `text/plain` that happens to start with HTML can be executed as HTML —
the classic "upload a .txt that is really a script" escalation.

### `Referrer-Policy: strict-origin-when-cross-origin`

Controls what goes in the `Referer` header on outbound navigations:

- Same origin :material-arrow-right: the full URL.
- Cross origin, HTTPS to HTTPS :material-arrow-right: the origin only.
- HTTPS to HTTP :material-arrow-right: nothing.

The point is that full URLs leak: a path like `/reset?token=…` handed to every site your users click
through to is a genuine incident. This is also the browser default now, so setting it explicitly
mainly documents the intent.

### `Permissions-Policy`

```text
camera=(), microphone=(), geolocation=(), interest-cohort=()
```

Disables powerful browser APIs for this document *and* every iframe inside it. A site that never uses
the camera should not be able to ask for it — and neither should a third-party embed you add later
without reading its source. `interest-cohort=()` opts out of FLoC-style cohort tracking.

Add capabilities back only when a feature actually needs them.

### `Strict-Transport-Security`

```text
max-age=63072000; includeSubDomains; preload
```

Two years, subdomains included, and eligible for the browser preload list. After the first HTTPS
response the browser refuses to speak plain HTTP to this host at all, which closes the downgrade
window an attacker on the network would otherwise have.

!!! warning "`includeSubDomains` and `preload` are hard to undo"

    Every subdomain must serve HTTPS before you ship this, and preload submission is effectively
    permanent for the lifetime of the domain. Both are the right default for a site that is HTTPS-only
    from day one; drop the two flags if any subdomain is not.

### `X-DNS-Prefetch-Control: on`

Lets the browser resolve DNS for links on the page ahead of a click. It is a performance header
rather than a security one, and it is set explicitly because the default differs between browsers.

---

## Link sanitising

`src/lib/sanitize.ts` guards every href that does not come from a literal in the source:

```ts title="src/lib/sanitize.ts (shape)"
/** URL schemes allowed in an `href`. Everything else is treated as hostile. */
const SAFE_PROTOCOLS = ['http', 'https', 'mailto']

/** True when `href` is a same-document/relative path or uses a safe scheme. */
export function isSafeHref(href: string): boolean

/** Returns the trimmed `href` when safe, and `undefined` otherwise. Never throws. */
export function sanitizeHref(href: string): string | undefined
```

`sanitizeHref` returns `undefined` rather than `'#'` on purpose: the caller can then skip rendering
the anchor entirely instead of emitting a dead link that looks clickable.

What it stops:

| Input | Result | Why it matters |
| --- | --- | --- |
| `javascript:alert(1)` | `undefined` | Executes on click, with your origin's cookies and DOM. |
| `data:text/html,<script>…` | `undefined` | Same, via a data document. |
| `vbscript:…` | `undefined` | Legacy, still honoured by some clients. |
| `//evil.example` | `undefined` | A protocol-relative URL silently inherits the page scheme. |
| `/about`, `#section`, `?q=1` | trimmed, unchanged | Same-document and same-origin references are safe by construction. |
| `docs/getting-started` | trimmed, unchanged | No scheme at all — a plain relative path. |
| `https://example.com`, `mailto:me@example.com` | trimmed, unchanged | Allowed scheme. |
| `HTTPS://EXAMPLE.COM` | trimmed, unchanged | The scheme comparison is lower-cased first. |
| `  javascript:…` (leading whitespace) | `undefined` | The input is trimmed before parsing — browsers ignore leading whitespace, so a naive `startsWith` check does not. |
| `''` (empty or whitespace-only) | `undefined` | An empty href resolves to the current page. |

!!! note "`tel:` is not on the list"

    `SAFE_PROTOCOLS` is `http`, `https` and `mailto`. Add `tel` (or anything else) to the array in
    `src/lib/sanitize.ts` if your project needs it — and add the case to `tests/lib/sanitize.spec.ts`,
    which the 100% threshold requires anyway.

`NavLinks` is the one consumer today: it maps over `siteConfig.navigation`, drops any entry
`sanitizeHref` rejects, and renders the rest. The rule to keep as the project grows is **any href
that did not come from a string literal in the component itself goes through `sanitizeHref`** —
config that someone will eventually point at a CMS, and anything user-supplied, always.

!!! note "The footer is the deliberate exception"

    `Footer` renders `siteConfig.links` directly, because those three URLs are literals in
    `site-config.ts` and are typed as required `string`s. Wrap them too the moment they stop being
    literals.

For JSON-LD, the companion is `serializeJsonLd` — see
[SEO & Metadata](seo.md#json-ld-structured-data).

!!! note "`rel` on external links"

    `target="_blank"` without `rel="noopener"` gives the opened page a `window.opener` reference back
    to yours. Modern browsers imply `noopener`, but the template still sets
    `rel="noopener noreferrer"` explicitly on external links — one attribute, no downside.

---

## Pinned dependencies

`.npmrc` sets `save-exact=true`, so every dependency in `package.json` is an exact version and
`package-lock.json` is committed.

Ranges are a supply-chain surface. `"^1.2.3"` means "whatever 1.x npm resolves at install time",
which is exactly the window a compromised release exploits — and it is why two developers, or a
developer and CI, can end up with different trees from the same commit. With exact pins:

- `npm ci` installs precisely what the lockfile records, and fails loudly if the manifest disagrees.
- An upgrade is a commit, with a diff, that someone reviews.
- A malicious patch release cannot arrive without a pull request.

Dependabot opens those pull requests weekly for npm and GitHub Actions. Read the changelog before
merging, and let CI run — the 100% coverage gate catches a surprising number of breaking minor
releases.

!!! tip "Before adding any dependency, ask what it replaces"

    The template has nine runtime dependencies. Every one of them earns its place: `next`, `react`,
    `react-dom`, `next-themes`, `lucide-react`, `clsx`, `tailwind-merge`, and the two Vercel
    telemetry packages. Each addition is code you now ship, review and trust.

---

## CI with least privilege

Every workflow declares the narrowest `permissions` block it can, because the default `GITHUB_TOKEN`
is far more powerful than a build needs:

```yaml title=".github/workflows/ci.yml (excerpt)"
permissions:
  contents: read
```

Jobs that need more — `security-events: write` for CodeQL, `pages: write` and `id-token: write` for
the docs deploy — declare it in their own workflow file rather than raising it globally.

Checkout runs with credentials disabled:

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    persist-credentials: false
```

By default `actions/checkout` writes the token into `.git/config`, where any script the job later
runs — including a `postinstall` from a dependency — can read it. CI never pushes, so it never needs
the token to persist.

Two more habits worth copying:

- **Untrusted input goes through the environment, never into a shell string.** The `commitlint` job
  passes pull request SHAs as `env:` variables rather than interpolating `${{ … }}` into `run:`,
  which is the standard script-injection vector for `pull_request` triggers.
- **Actions are pinned to a major tag** (`@v4`) at minimum. For a repository handling secrets, pin
  to a full commit SHA.

CodeQL runs on pull requests and on a schedule, and reports into the Security tab. Details in the
[CI/CD guide](../guides/ci-cd.md).

---

## Extending the CSP

Adding any third-party script, embed or font requires a matching CSP change — otherwise the browser
blocks it and the console fills with violation errors. Work out which directive governs the resource
and add the **narrowest** origin that works.

=== "Analytics script"

    ```ts
    'script-src': [...scriptSrc, 'https://plausible.io'],
    'connect-src': [...connectSrc, 'https://plausible.io'],
    ```

    Almost every analytics vendor needs two directives: `script-src` to load the snippet and
    `connect-src` to send the beacon. Missing the second one is the usual reason "the script loads
    but no events arrive".

    Vercel Analytics and Speed Insights already work with the shipped policy, because
    `security-headers.ts` allowlists `https://va.vercel-scripts.com` in `script-src` and both that
    origin and `https://vitals.vercel-insights.com` in `connect-src`. Remove those constants along
    with the packages if you drop Vercel telemetry.

=== "YouTube / Vimeo embed"

    ```ts
    'frame-src': ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
    ```

    `frame-src` controls what *you* may embed; `frame-ancestors` controls who may embed *you*. They
    are easy to confuse and do opposite things.

=== "Google Fonts"

    ```ts
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    ```

    Better: do not. `next/font` downloads the font at build time and serves it from your origin —
    faster, no third-party request, no CSP change, and no GDPR question about IP addresses reaching
    a font CDN.

=== "Images from a CDN"

    ```ts
    'img-src': ["'self'", 'data:', 'blob:', 'https://images.example.com'],
    ```

    Narrowing `img-src` from the shipped `https:` to a named host is the change worth making here.
    And add the same host to `images.remotePatterns` in `next.config.ts` — Next's allow-list and the
    browser's policy are enforced independently, so both have to know.

### Testing a policy change

1. `npm run build && npm run start` — the dev server is more permissive than production.
2. Load the page with DevTools open and watch for `Refused to load …` violations.
3. `curl -sI http://localhost:3000 | grep -i content-security-policy` to see the header verbatim.
4. Once deployed, run the URL through <https://securityheaders.com>.

!!! danger "Do not fix a violation with a wildcard"

    `script-src *` or `script-src 'unsafe-eval'` makes the error go away by removing the protection.
    Find the specific origin. If a vendor genuinely requires `unsafe-eval`, that is information about
    the vendor worth acting on.

---

## Reporting a vulnerability

Do not open a public issue. Email the maintainer at the address in `package.json`, or use GitHub's
private vulnerability reporting on the repository's Security tab.
