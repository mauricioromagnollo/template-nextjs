# Deployment

The template is built to deploy on [Vercel](https://vercel.com), and built so that it does not have
to.

## Vercel

### 1. Import the repository

1. <https://vercel.com/new> :material-arrow-right: **Import Git Repository** :material-arrow-right:
   select your repository.
2. Framework preset is detected as **Next.js** — `vercel.json` declares it explicitly, so there is
   nothing to guess:

   ```json title="vercel.json"
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "framework": "nextjs"
   }
   ```

3. Leave the build command, output directory and install command at their defaults. `npm ci` and
   `next build` are exactly right.
4. Set the Node.js version to **24.x** in Project Settings :material-arrow-right: General, to match
   `.node-version`.

`output: 'standalone'` in `next.config.ts` is harmless here — Vercel uses its own build output
format and ignores it.

### 2. Environment variables

Project Settings :material-arrow-right: Environment Variables. Set them per environment; the values
differ, and that is the point.

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | `My Site` | `My Site` | `My Site` |
| `NEXT_PUBLIC_SITE_URL` | `https://example.com` | `https://$VERCEL_URL` — see below | `http://localhost:3000` |
| `APP_ENV` | `production` | `development` | `development` |

!!! warning "`APP_ENV` accepts three values, and `preview` is not one of them"

    `APP_ENVS` in `src/config/environment/app-env.ts` is `development | test | production`; anything
    else silently degrades to `development`. Use `development` for previews.

!!! danger "Previews are indexable by default"

    The shipped `robots.ts` emits `Allow: /` unconditionally — it does not read `APP_ENV`. Keep
    previews behind Vercel's deployment protection, or add the environment gate shown in
    [SEO & Metadata](../architecture/seo.md#robotsts). Two indexed copies of the same content is the
    fastest way to compete with yourself.

!!! tip "`NEXT_PUBLIC_SITE_URL` on previews"

    Every preview gets a different hostname, so a fixed value would make canonical URLs wrong on all
    of them, and leaving it unset is worse: the fallback is `http://localhost:3000`. Two workable
    approaches:

    - Set the Preview value to `https://$VERCEL_URL`. Vercel injects `VERCEL_URL` with the
      deployment's own hostname and expands the reference at build time.
    - Or set it to the production URL and accept that preview canonicals point at production — fine
      as long as previews are not publicly crawlable.

Remember that `NEXT_PUBLIC_*` values are inlined at build time. Changing one in the dashboard does
nothing until you redeploy.

### 3. Domain

Project Settings :material-arrow-right: Domains. Add the apex and the `www` variant, and set one as a
redirect to the other — serving both is a duplicate-content problem. Vercel provisions the TLS
certificate automatically.

Then update `NEXT_PUBLIC_SITE_URL` to the final domain and **redeploy**, or every canonical tag, the
sitemap and `robots.txt` will keep advertising the `.vercel.app` hostname.

---

## Preview versus production

| | Preview | Production |
| --- | --- | --- |
| Trigger | Every push to `main` (plus `workflow_dispatch`) | A GitHub **release** being published (plus `workflow_dispatch`) |
| Workflow | `deploy-preview.yml` | `deploy-production.yml` |
| GitHub environment | `preview` | `production` |
| URL | A unique per-deployment hostname | Your domain |
| `vercel pull` / `vercel build` | `--environment=preview`, no `--prod` | `--environment=production`, `--prod` |
| Concurrency | Superseded runs are cancelled | Never cancelled mid-rollout |
| Purpose | See `main` running in a real environment before tagging | Ship it |

!!! note "Nothing deploys from a pull request"

    Both workflows are post-merge. A pull request runs `CI` only; `main` gets a preview URL, and
    production ships when you publish a release. If you want per-pull-request previews instead,
    change `deploy-preview.yml`'s trigger to `pull_request` — the rest of the workflow is unchanged.

### The deploy workflows

Both follow the same shape, which is the officially supported CLI flow rather than a third-party
action:

```yaml title=".github/workflows/deploy-production.yml (shape)"
name: Deploy Production

on:
  release:
    types: [published]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false # (1)!

permissions:
  contents: read

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: npm

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel environment information
        run: vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --prod --token="$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy prebuilt output
        run: vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

1.  Production deploys are **not** cancelled in progress — interrupting a rollout is worse than
    finishing an obsolete one. The preview workflow does cancel, because a superseded preview is
    just wasted minutes.

`deploy-preview.yml` is the same three steps with `--environment=preview` and no `--prod`, triggered
on every push to `main`. Both workflows publish the resulting URL through a GitHub `environment`
(`preview` / `production`), so the link shows up on the deployments page rather than as a comment.

Why `vercel build` + `vercel deploy --prebuilt` rather than letting Vercel build from Git:

- The build runs in the same GitHub Actions environment as CI, using the same Node version.
- Deploys can be gated behind the CI workflow.
- The build log lives next to every other log for that commit.

### Required secrets

Repository Settings :material-arrow-right: Secrets and variables :material-arrow-right: Actions:

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | Vercel :material-arrow-right: Account Settings :material-arrow-right: Tokens :material-arrow-right: Create. Scope it to the project. |
| `VERCEL_ORG_ID` | `vercel link` locally, then read `.vercel/project.json` — or Team Settings :material-arrow-right: General. |
| `VERCEL_PROJECT_ID` | Same file, or Project Settings :material-arrow-right: General. |

```bash
npx vercel link
cat .vercel/project.json
# { "orgId": "team_…", "projectId": "prj_…" }
```

`.vercel` is git-ignored — those IDs are not secret in the cryptographic sense, but they do not
belong in the repository either.

!!! warning "Until the secrets exist, both deploy workflows fail"

    That is a red X on every push to `main` from the first day. Either add the secrets, or delete the
    two workflow files if you are deploying somewhere else.

### Disabling Vercel's own Git integration

If you use these workflows, turn off Vercel's automatic deployments (Project Settings
:material-arrow-right: Git :material-arrow-right: **Ignored Build Step**, or disconnect the Git
integration). Otherwise every push deploys twice: once by Vercel, once by the workflow.

Pick one. Vercel's own integration is simpler; the workflow gives you the CI gate.

---

## Deploying somewhere else

`output: 'standalone'` means the app is a plain Node server, so any container host will run it.
The full walkthrough is in the [Docker guide](docker.md#deploying-the-image); the short version:

```bash
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL="https://example.com" \
  --build-arg NEXT_PUBLIC_SITE_NAME="My Site" \
  -t ghcr.io/<owner>/<repo>:1.0.0 .

docker push ghcr.io/<owner>/<repo>:1.0.0
```

Then run it on ECS, Cloud Run, Fly.io, Railway, Render, Kubernetes or a VPS, with `APP_ENV=production`
at runtime and TLS terminated in front.

Without Vercel you also lose a few things the template assumes. Each has a replacement:

| Vercel gives you | Elsewhere |
| --- | --- |
| Image optimisation | Works, but needs `sharp` installed and CPU on your host. Consider an image CDN. |
| Automatic TLS | Caddy, Traefik, a load balancer, or certbot. |
| Preview URLs per pull request | Your platform's review-app feature, if it has one. |
| `@vercel/analytics`, `@vercel/speed-insights` | They silently no-op off-platform. Remove them or swap in Plausible/Umami — and update the [CSP](../architecture/security.md#extending-the-csp). |
| ISR / on-demand revalidation | Works on a single instance; needs shared cache handling across several. |

!!! note "Static export is not an option here"

    `next export` / `output: 'export'` cannot serve `robots.ts`, `sitemap.ts`, `ImageResponse` routes
    or response headers from `next.config.ts`. The template uses all four. Removing them to get a
    static site is a real choice, but it is not a configuration flag.

---

## Go-live checklist

Work through this before announcing the site.

### Domain and configuration

- [ ] Custom domain added and verified; TLS certificate issued.
- [ ] `www` and apex resolved — one redirects to the other.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the final origin, **no trailing slash**, and redeployed.
- [ ] `NEXT_PUBLIC_SITE_NAME` set.
- [ ] `APP_ENV=production` in the production environment only.
- [ ] `src/config/site/site-config.ts` updated — description, author, `navigation`, social links.

### Search and social

- [ ] `https://example.com/robots.txt` returns `Allow: /` and the correct sitemap URL.
- [ ] `https://example.com/sitemap.xml` lists the real routes with the real origin.
- [ ] Canonical tags point at the production domain (view source, search for `rel="canonical"`).
- [ ] The Open Graph image renders: check `/opengraph-image` directly, then run the URL through the
      [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and the
      [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
- [ ] Favicon renders in a browser tab.
- [ ] Structured data validated at <https://validator.schema.org/>.
- [ ] Sitemap submitted to [Google Search Console](https://search.google.com/search-console) and
      [Bing Webmaster Tools](https://www.bing.com/webmasters).
- [ ] Preview deployments are **not** publicly crawlable — deployment protection is on, or
      `robots.ts` has been gated on `APP_ENV`.

### Quality and security

- [ ] `make check` passes on `main`.
- [ ] `make test-e2e` passes against the production URL:
      `PLAYWRIGHT_BASE_URL=https://example.com npm run test:e2e`.
- [ ] Headers verified: `curl -sI https://example.com`, then a scan at <https://securityheaders.com>.
- [ ] No CSP violations in the browser console on any page.
- [ ] Lighthouse run on the production URL — performance, accessibility, best practices, SEO.
- [ ] Branch protection on `main` requiring the CI checks.

### Analytics and monitoring

- [ ] `@vercel/analytics` reporting (Vercel dashboard :material-arrow-right: Analytics), or your
      replacement is installed and allowed by the CSP.
- [ ] `@vercel/speed-insights` reporting Core Web Vitals.
- [ ] Uptime check configured against the production URL.
- [ ] You know how to roll back: Vercel :material-arrow-right: Deployments
      :material-arrow-right: **Promote to Production** on the last good one, or redeploy the previous
      image tag.

!!! tip "Do the redeploy last"

    `NEXT_PUBLIC_*` values are baked into the bundle at build time. Setting the final domain and
    *not* redeploying is the single most common launch-day mistake — the site works, and every
    canonical URL is wrong.
