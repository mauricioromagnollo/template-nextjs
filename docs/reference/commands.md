# Commands

Every npm script and every Makefile target, what it runs, and when to reach for it.

!!! tip "`make` with no arguments prints the menu"

    `help` is the default target, so `make` lists every command with a one-line description. It is
    generated from the comments in the `Makefile`, so it can never drift from what is actually there.

The Makefile is a thin front door: most targets wrap the npm script of the same name, so there is one
vocabulary regardless of whether the work happens in npm, Docker Compose or a Docker container.

---

## npm scripts

### Development

| Script | Runs | When |
| --- | --- | --- |
| `npm run dev` | `next dev --turbopack` | The everyday development server on <http://localhost:3000>. Turbopack gives near-instant hot updates. |
| `npm run build` | `next build` | A production build. Emits `.next/` and, thanks to `output: 'standalone'`, `.next/standalone/`. Run it before `start`. |
| `npm start` | `next start` | Serves the production build on `$PORT` (default 3000). Requires a prior `build`. |

### Quality

| Script | Runs | When |
| --- | --- | --- |
| `npm run lint` | `eslint .` | Reports lint problems. Part of `check`. |
| `npm run lint:fix` | `eslint . --fix` | Fixes the auto-fixable subset in place. |
| `npm run typecheck` | `tsc --noEmit` | Full type check. Next's build does its own, but this is faster and catches test files too. |
| `npm run format` | `prettier --write .` | Formats everything Prettier owns. `docs/` and `mkdocs.yml` are excluded. |
| `npm run format:check` | `prettier --check .` | Reports formatting drift without writing. The first step of `check`. |
| `npm run check` | `format:check && lint && typecheck && test:coverage` | **The local gate.** Same commands as CI's `quality` job, cheapest first. Run before every push. |

### Testing

| Script | Runs | When |
| --- | --- | --- |
| `npm test` | `vitest` | Watch mode. Alias for `test:watch`. |
| `npm run test:watch` | `vitest` | Watch mode — reruns only the specs affected by your change. Keep it open in a second terminal. |
| `npm run test:unit` | `vitest run` | Single run, no coverage. Fastest full pass. |
| `npm run test:coverage` | `vitest run --coverage` | Single run plus coverage, enforcing the 100% thresholds. Writes `coverage/` (text, HTML, lcov). |
| `npm run test:e2e` | `playwright test` | The Chromium end-to-end suite. Locally it builds and serves the app first; on CI it expects a prior build. |
| `npm run test:e2e:install` | `playwright install --with-deps chromium` | One-time (and after a Playwright upgrade): downloads the browser and its OS dependencies. |

### Lifecycle

| Script | Runs | When |
| --- | --- | --- |
| `npm run prepare` | `husky` | Automatic on `npm ci` / `npm install`. Registers the Git hooks. Never run by hand. |

---

## Makefile targets

### Setup and development

| Target | Equivalent | Notes |
| --- | --- | --- |
| `make help` | — | Default target. Lists everything. |
| `make setup` | `install` + `.env` + Playwright browser | First command after cloning. Never overwrites an existing `.env`. |
| `make install` | `npm ci` | Lockfile-exact install. Use after pulling a dependency change. |
| `make dev` | `npm run dev` | Development server. |
| `make build` | `npm run build` | Production build. |
| `make start` | `npm start` | Serve the production build. |

### Quality

| Target | Equivalent |
| --- | --- |
| `make lint` | `npm run lint` |
| `make lint-fix` | `npm run lint:fix` |
| `make format` | `npm run format` |
| `make format-check` | `npm run format:check` |
| `make typecheck` | `npm run typecheck` |
| `make check` | `npm run check` |

### Testing

| Target | Equivalent |
| --- | --- |
| `make test` | `npm test` |
| `make test-watch` | `npm run test:watch` |
| `make test-unit` | `npm run test:unit` |
| `make test-coverage` | `npm run test:coverage` |
| `make test-e2e` | `npm run test:e2e` |
| `make test-e2e-install` | `npm run test:e2e:install` |

!!! note "Hyphens, not colons"

    npm scripts use `:` (`test:coverage`); make targets use `-` (`test-coverage`). A colon has
    meaning in a Makefile rule, so it cannot appear in a target name.

### Docker

| Target | Runs | Notes |
| --- | --- | --- |
| `make up` | `docker compose up --build --detach` | Starts the development stack, detached. Builds on the first run. |
| `make down` | `docker compose down --remove-orphans` | Stops and removes containers. Volumes survive. |
| `make stop` | `docker compose stop` | Stops without removing — faster to resume. |
| `make restart` | `docker compose restart app` | Restarts the running container. It does **not** rebuild — after changing the compose file or a Dockerfile, run `make up` instead. |
| `make logs` | `docker compose logs --follow app` | Follows the output. |
| `make shell` | `docker compose exec app bash` | A shell inside the running container. The compose service is named `app`. |
| `make docker-build` | `docker build --build-arg NEXT_PUBLIC_SITE_URL=… --build-arg NEXT_PUBLIC_SITE_NAME=… -t template-nextjs:latest .` | Builds the **production** image. Override `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `DOCKER_IMAGE` or `DOCKER_TAG` on the command line for a real deployment. |
| `make docker-clean` | `docker compose down --volumes --remove-orphans` then `docker image rm template-nextjs:latest` | Removes containers, volumes and the locally built production image. Both steps are prefixed with `-`, so a missing container or image is not an error. |

### Housekeeping and docs

| Target | Removes / runs | Notes |
| --- | --- | --- |
| `make clean` | `./scripts/clear-all.sh` — `.next/`, `out/`, `build/`, `dist/`, `coverage/`, `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache`, `site/`, `.swc`, `.turbo`, `next-env.d.ts`, `*.tsbuildinfo` **and `node_modules/`** | Returns the clone to a freshly-cloned state, so `make setup` (or `make install`) is required afterwards. Falls back to `sudo` for files the Docker dev container left root-owned. |
| `make docs` | `docker run --rm -it -p 8000:8000 -v $(CURDIR):/docs squidfunk/mkdocs-material:9.7.7` | Documentation preview on <http://localhost:8000> with live reload. **Docker is required** — there is no Python virtualenv; the image ships the pinned toolchain. Override the port with `make docs DOCS_PORT=8080`. |
| `make docs-build` | `docker run --rm -v $(CURDIR):/docs squidfunk/mkdocs-material:9.7.7 build --strict` | The same `mkdocs build --strict` that `publish-docs.yml` runs (CI installs `docs/requirements.txt` with pip instead of using the image; the versions are kept in sync). Fails on a broken link or a page missing from `nav:`. Run before pushing docs changes. |

---

## Recipes

=== "First time in the repository"

    ```bash
    make setup
    make dev
    ```

=== "Before pushing"

    ```bash
    make check
    make test-e2e   # if the change touches rendering, routing or metadata
    ```

=== "CI failed on formatting or lint"

    ```bash
    make format
    make lint-fix
    make check
    ```

=== "Coverage dropped below 100%"

    ```bash
    make test-coverage
    open coverage/index.html   # red lines are uncovered statements
    ```

=== "Debugging a flaky E2E test"

    ```bash
    npx playwright test --ui        # time-travel debugger
    npx playwright test --headed    # watch the browser
    npx playwright show-report      # the last HTML report
    ```

=== "Something is stale"

    ```bash
    make clean
    make install
    make dev
    ```

=== "Testing against a deploy preview"

    ```bash
    PLAYWRIGHT_BASE_URL=https://my-site-git-feature-me.vercel.app npm run test:e2e
    ```

=== "Writing documentation"

    ```bash
    make docs        # preview at localhost:8000
    make docs-build  # verify the strict build before pushing
    ```

---

## Commands that are not wrapped

Useful things with no npm script or make target of their own.

```bash
npx vitest run tests/lib/seo.spec.ts     # one spec file
npx vitest run -t "returns a canonical"  # one test by name
npx playwright test --debug              # step through with the inspector
npx commitlint --from HEAD~5 --to HEAD   # validate the last five commit messages
npm outdated                             # what Dependabot is about to open PRs for
npx next info                            # environment report, for bug reports
```

Add a target only when you type the command more than a few times a week — a Makefile that lists
everything is as unhelpful as one that lists nothing.
