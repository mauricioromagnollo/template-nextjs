# Installation

This page takes you from an empty machine to a running development server.

## Requirements

| Tool | Version | Why |
| --- | --- | --- |
| **Node.js** | `24.16.0` — pinned in `.node-version` | The version CI, Docker and the `engines` field all agree on. |
| **npm** | Ships with Node 24 | The lockfile is `package-lock.json`. Yarn/pnpm will produce a different tree. |
| **Git** | any recent version | Required for husky hooks to install. |
| **make** | preinstalled on macOS and Linux | Optional but recommended — every workflow has a target. |
| **Docker** | 24+ with Compose v2 | Optional. Only needed for the container workflows. |

### Installing the right Node version

`.node-version` is read automatically by `fnm`, `nvm` (with the `--version-file-strategy` setting or
a shell hook), `asdf` and `volta`, and it is the same file `actions/setup-node` reads in CI.

=== "fnm"

    ```bash
    fnm install
    fnm use
    ```

=== "nvm"

    ```bash
    nvm install
    nvm use
    ```

=== "asdf"

    ```bash
    asdf install nodejs "$(cat .node-version)"
    ```

Confirm before continuing:

```bash
node --version   # v24.16.0
npm --version
```

!!! warning "Do not run this template on Node 20 or 22"

    Next.js 16 requires Node 20.9+, but the template pins 24.16.0 everywhere — CI, both Dockerfiles
    and `engines`. Running a different major locally is the fastest way to get a build that works on
    your machine and fails in CI.

---

## 1. Create your repository

This repository is a **GitHub template**, so you do not need to fork it.

1. Open <https://github.com/mauricioromagnollo/template-nextjs>.
2. Click **Use this template** :material-arrow-right: **Create a new repository**.
3. Pick an owner, a name and a visibility, then create it.

Your repository starts with a single commit and no link to the upstream template — you own the
history from the first line.

!!! tip "Prefer the CLI?"

    ```bash
    gh repo create my-site --template mauricioromagnollo/template-nextjs --private --clone
    ```

### Clone it

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
```

---

## 2. Set the project up

=== "With make (recommended)"

    ```bash
    make setup
    ```

    `setup` runs three things, in this order:

    1. `cp .env.example .env` — only if `.env` does not already exist, so it never overwrites your
       local values.
    2. `npm ci` — a clean, lockfile-exact install.
    3. `npm run test:e2e:install` — downloads the Chromium build Playwright needs, plus its OS
       dependencies.

=== "Manually"

    ```bash
    npm ci
    cp .env.example .env
    npm run test:e2e:install
    ```

    Use `npm ci`, not `npm install`: it installs exactly what the lockfile says and fails if
    `package.json` and `package-lock.json` disagree. `npm install` would silently update the tree.

The `prepare` script runs `husky` as part of the install, which registers the Git hooks in
`.husky/`. From this point on, commits are linted and formatted automatically — see
[Development](../guides/development.md#the-commit-hooks).

!!! note "The Playwright download is ~150 MB"

    It is a one-time cost and it is cached under `~/.cache/ms-playwright`. If you never intend to run
    the end-to-end suite locally, skip `npm run test:e2e:install` — nothing else depends on it.

### What is in `.env`

`.env` is git-ignored; `.env.example` is the committed reference. The defaults work for local
development with no changes:

```bash title=".env"
NEXT_PUBLIC_SITE_NAME="Next.js Template"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
APP_ENV=development
PORT=3000
```

Full details — including which of these are inlined into the client bundle — are in the
[environment variable reference](../reference/environment-variables.md).

---

## 3. Run the development server

```bash
make dev
# or: npm run dev
```

Next starts with Turbopack on <http://localhost:3000>. Edits to files under `src/` are reflected
without a full reload.

To use a different port:

```bash
PORT=4000 npm run dev -- --port 4000
```

!!! warning "`PORT` alone does not move the Next dev server"

    `PORT` is read by `playwright.config.ts` and by the production server (`npm run start`,
    `node server.js`). The Next **dev** server takes `--port`. Set both if you change it, so the
    end-to-end suite targets the same origin.

---

## 4. Verify the install

Run the same gate CI runs:

```bash
make check
```

That is `format-check` :material-arrow-right: `lint` :material-arrow-right: `typecheck`
:material-arrow-right: `test-coverage` :material-arrow-right: `build`, cheapest first. A fresh clone
should pass all five with 100% coverage. If it does not, something in your toolchain differs — check
the Node version first.

!!! note "`make check` is one step longer than `npm run check`"

    The npm script stops after `test:coverage`; the make target also runs `build`, which is what the
    `quality` job in CI does.

The end-to-end suite is separate because it builds the app:

```bash
make test-e2e
```

Locally, `playwright.config.ts` runs `npm run build && npm run start` for you and tears the server
down afterwards. Expect the first run to take a couple of minutes.

---

## Running with Docker instead

You do not need Node installed on the host for this path — only Docker.

```bash
make up      # docker compose up -d  (build on first run)
make logs    # follow the container output
make down    # stop and remove the containers
```

The development compose service bind-mounts your working tree into `/app`, so hot reload works
exactly as it does on the host. `node_modules` is kept inside the container in an anonymous volume,
so a host `node_modules` built for a different platform cannot leak in.

To build and run the **production** image:

```bash
make docker-build
docker run --rm -p 3000:3000 template-nextjs:latest
```

!!! warning "`NEXT_PUBLIC_*` values are baked in at build time"

    Next inlines them into the client bundle during `next build`, so passing them at `docker run`
    time does nothing. Pass them as build arguments:

    ```bash
    docker build \
      --build-arg NEXT_PUBLIC_SITE_URL="https://example.com" \
      --build-arg NEXT_PUBLIC_SITE_NAME="My Site" \
      -t template-nextjs:latest .
    ```

The full container story — stage layout, the healthcheck, why the dev image runs as root — is in the
[Docker guide](../guides/docker.md).

---

## Troubleshooting

??? question "`npm ci` fails with `EBADENGINE`"

    Your Node version does not satisfy `engines.node: >=24.16.0`. Install the version in
    `.node-version` and try again.

??? question "Git hooks do not run"

    `npm ci` triggers `prepare`, which runs `husky`. If you installed with `--ignore-scripts`, run
    `npx husky` once. Also confirm `git config core.hooksPath` prints `.husky/_`.

??? question "Playwright fails with `Executable doesn't exist`"

    The browser was never downloaded. Run `npm run test:e2e:install`.

??? question "The port is already in use"

    Something else is on 3000 — often a container left running. `make down` stops the compose stack;
    `lsof -i :3000` finds the rest.

??? question "Generated files are owned by root after using Docker"

    The development image runs as root by design, so bind-mounted output (`.next/`, `coverage/`) can
    end up root-owned on the host. `make clean` removes those directories and falls back to `sudo`
    when it has to.

---

## Next steps

- [Project Structure](project-structure.md) — what every file does.
- [Configuration](configuration.md) — make the template yours.
- [Development](../guides/development.md) — the day-to-day loop.
