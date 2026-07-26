# Environment Variables

Four variables. `.env.example` is the committed reference; `.env` is git-ignored and holds your local
values.

```bash
cp .env.example .env
```

## The variables

| Variable | Scope | Required | Default | Read at |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | Client + server | No | `Next.js Template` | Build time |
| `NEXT_PUBLIC_SITE_URL` | Client + server | **In production** | `http://localhost:3000` | Build time |
| `APP_ENV` | Server only | No | `development` | Run time |
| `PORT` | Server only | No | `3000` | Run time |

---

### `NEXT_PUBLIC_SITE_NAME`

The display name of the site.

**Where it is read:** `src/config/environment/environment.ts`, surfaced through
`siteConfig.name`.

**What uses it:** the `metadata.applicationName` field, the site-name suffix `buildMetadata()` appends
to every page title, `og:site_name`, the JSON-LD `name`, the header wordmark, the footer and the
letter rendered into the generated icons.

**If absent:** falls back to `Next.js Template`. Nothing breaks; the site is just named after the
template.

```bash
NEXT_PUBLIC_SITE_NAME="Acme Docs"
```

---

### `NEXT_PUBLIC_SITE_URL`

The canonical origin of the deployment. **No trailing slash.**

**Where it is read:** `src/config/environment/environment.ts`, surfaced through `siteConfig.url`.

**What uses it:**

- `metadataBase` in `buildMetadata()` — the origin every relative metadata URL resolves against.
- `alternates.canonical` on every page.
- `og:url` and `og:image` absolute URLs.
- `sitemap.ts` — every entry.
- `robots.ts` — the `sitemap` and `host` fields.

**If absent:** falls back to `http://localhost:3000`. That is correct for development and
**catastrophic in production**: every canonical tag, every Open Graph URL and the whole sitemap
advertise `localhost`. Search engines see a site pointing at an address they cannot reach, and the
symptom does not appear until a Search Console report weeks later.

```bash
# Development
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Production
NEXT_PUBLIC_SITE_URL="https://example.com"
```

!!! note "A trailing slash is stripped for you"

    `normalizeUrl()` in `src/config/environment/environment.ts` removes any trailing slashes before
    the value reaches `siteConfig.url`, so `https://example.com/` and `https://example.com` behave
    identically. Still omit it — the normalisation exists so a mistake is harmless, not so it becomes
    a style choice.

!!! tip "Preview deployments on Vercel"

    Every preview gets its own hostname, so a fixed value is wrong on all of them, and the fallback
    is `http://localhost:3000` rather than anything Vercel-aware. Set the Preview environment's value
    explicitly, or reference Vercel's own variable when configuring the project:

    ```bash
    NEXT_PUBLIC_SITE_URL="https://$VERCEL_URL"
    ```

---

### `APP_ENV`

Which environment the process believes it is running in. One of `development`, `test`, `production`.

**Where it is read:** `src/config/environment/app-env.ts` defines the union and its type guard;
`environment.ts` validates the value and exposes it as `environment.appEnv`.

**What uses it:** nothing in the shipped application code reads `environment.appEnv` yet. It exists,
validated and typed, as the hook for behaviour you want to differ per deployment — gating
`robots.ts`, verbose logging, a feature flag, a debug banner. `src/config/environment/app-env.ts`
ships `isProduction()`, `isDevelopment()` and `isTest()` for that purpose.

**If absent or invalid:** falls back to `development`. `parseAppEnv()` never throws on bad input, so a
typo degrades to the default instead of crashing the process at boot.

```bash
APP_ENV=production
```

!!! warning "The shipped `robots.ts` allows every crawler, everywhere"

    It does **not** branch on `APP_ENV`, so a public preview deployment is indexable. The template
    relies on Vercel's deployment protection for that; if your previews are public, add the gate —
    see [SEO & Metadata](../architecture/seo.md#robotsts).

!!! note "Why not just use `NODE_ENV`?"

    `NODE_ENV` has only three meaningful values to the tooling, and Next controls it: `development`
    under `next dev`, `production` under `next build`/`next start`. A preview deployment is
    `NODE_ENV=production` *and* not the production site. `APP_ENV` is the separate axis — where the
    deployment lives, rather than how it was compiled.

    Never set `NODE_ENV` by hand.

---

### `PORT`

The TCP port the server listens on.

**Where it is read:** by Next's production server (`npm start`, or `node server.js` in the
container), and by `playwright.config.ts`:

```ts title="playwright.config.ts (excerpt)"
const PORT = Number(process.env.PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`
```

**If absent:** `3000`.

!!! warning "`PORT` does not move the Next dev server"

    `next dev` takes `--port`. If you change the port, change both, or the end-to-end suite will
    target an origin nothing is listening on:

    ```bash
    PORT=4000 npm run dev -- --port 4000
    ```

---

## `NEXT_PUBLIC_` — what the prefix actually means

This is the single most consequential thing to understand about configuration in a Next.js app.

At build time, Next performs a **textual substitution**: every occurrence of
`process.env.NEXT_PUBLIC_ANYTHING` in code that can reach the browser is replaced with a string
literal.

```ts
// You write:
const url = process.env.NEXT_PUBLIC_SITE_URL

// The bundle contains:
const url = 'https://example.com'
```

Four consequences follow directly:

**1. The value is public.** It is in a JavaScript file any visitor can download and read. There is no
obfuscation and no runtime lookup.

**2. Changing it requires a rebuild.** The value is not read at process start — it is not read at all
at run time. `docker run -e NEXT_PUBLIC_SITE_URL=…` does nothing. On Vercel, changing the variable in
the dashboard does nothing until you redeploy.

**3. It means one build per environment.** Staging and production need different values, so they are
different builds. That is a property of client-side configuration in general, not of this template.

**4. Only literal, static references are replaced.** The substitution is textual:

```ts
process.env.NEXT_PUBLIC_SITE_URL          // ✓ replaced
process.env[`NEXT_PUBLIC_${key}`]         // ✗ not replaced — undefined in the browser
const { NEXT_PUBLIC_SITE_URL } = process.env  // ✗ unreliable
```

!!! danger "Never put a secret behind `NEXT_PUBLIC_`"

    An API key, a database URL, a private token, a webhook secret — none of these belong behind that
    prefix, regardless of how convenient it is. "It is only used server-side" is not a defence: the
    prefix is what decides, not the usage.

    Server-only variables have no prefix. They stay in `process.env`, are read at run time, and never
    reach the bundle. `APP_ENV` and `PORT` are the two in this template.

### Choosing a prefix for a new variable

| Question | Answer |
| --- | --- |
| Does a Client Component need it? | Yes :material-arrow-right: `NEXT_PUBLIC_`. No :material-arrow-right: no prefix. |
| Is it a secret? | Then it must not be `NEXT_PUBLIC_`. If a Client Component needs a secret, the design is wrong — proxy through a Route Handler or a Server Action. |
| Does it change per environment without a rebuild? | It cannot be `NEXT_PUBLIC_`. |

---

## Where values come from, by environment

| Environment | Source |
| --- | --- |
| Local development | `.env` (git-ignored), created from `.env.example`. Requires a dev-server restart to take effect. |
| Local Docker | `env_file: .env` in `docker-compose.yaml` for server-side values; `NEXT_PUBLIC_*` come from `--build-arg` at image build time. |
| Production Docker | `--build-arg` for `NEXT_PUBLIC_*`; `-e` / the platform's env config for `APP_ENV` and `PORT`. |
| Vercel | Project Settings :material-arrow-right: Environment Variables, scoped to Production / Preview / Development. |
| GitHub Actions | Repository secrets, exposed through `env:` on the job or step. CI itself needs none of these four. |

Next also loads `.env.local`, `.env.development` and `.env.production` if present, with `.env.local`
taking precedence. The template ships only `.env.example` to keep the precedence chain short and
predictable.

!!! note "Do not commit `.env`"

    `.gitignore` covers it, with an exception for examples:

    ```gitignore
    .env*
    # `!.env*.example` rather than `!.env.example`: a future `.env.staging.example`
    # also needs to be committed.
    !.env*.example
    ```

---

## Adding a variable

1. **Add it to `.env.example`** with a comment explaining what it is and a safe default. This is the
   documentation other developers will actually read.
2. **Add it to `src/config/environment/environment.ts`**, with parsing, validation and a fallback.
   Nothing else in the codebase should touch `process.env` — one place to look when a value is wrong.
3. **Write the spec** in `tests/config/`, covering the present, absent and invalid cases. All three
   branches are needed for the 100% threshold.
4. **If it is `NEXT_PUBLIC_`**, add it to the `Dockerfile` as an `ARG` + `ENV` pair in the builder
   stage, or it will be missing from container builds.
5. **Add it to the deployment target** — Vercel's dashboard, or your platform's configuration.
6. **Document it here** and in [Configuration](../getting-started/configuration.md).

```ts title="src/config/environment/environment.ts (pattern)"
/** Trims the value and falls back when it is missing or blank. */
function readString(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? fallback : trimmed
}

/** Drops trailing slashes so URLs can be composed with plain concatenation. */
export function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '')
}
```

`readEnvironment()` composes those two and is exported so specs can drive it with an explicit
`EnvironmentSource` instead of mutating `process.env`. The module-level `environment` constant is
just `readEnvironment()` called once with the real values.

---

## Troubleshooting

??? question "A change to `.env` has no effect"

    Restart the dev server — variables are read once, at process start. If it is a `NEXT_PUBLIC_`
    variable, you need a rebuild, not a restart.

??? question "`NEXT_PUBLIC_SITE_URL` is `undefined` in the browser"

    The reference was not a static `process.env.NEXT_PUBLIC_SITE_URL`. Dynamic keys and destructuring
    are not substituted. Read it once in `config/environment` and import the typed value.

??? question "The container still points at localhost"

    The value was passed at run time. `NEXT_PUBLIC_*` must be `--build-arg` at image build time.

??? question "A preview deployment is showing up in search results"

    The shipped `robots.ts` allows every crawler regardless of `APP_ENV`. Either keep previews behind
    Vercel's deployment protection, or add the `APP_ENV` gate shown in
    [SEO & Metadata](../architecture/seo.md#robotsts).

??? question "Canonical URLs point at the wrong origin"

    `NEXT_PUBLIC_SITE_URL` was missing at **build** time, so the bundle inlined the
    `http://localhost:3000` fallback. Setting it after the fact does nothing — rebuild.
