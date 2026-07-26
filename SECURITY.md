# Security Policy

## What this repository is

`template-nextjs` is a **starter template**, not a running service. It has no backend,
no database, no authentication, no sessions, no user accounts and stores no data. The
deployed demo is a set of statically rendered pages.

That shapes what counts as a vulnerability here. There is no server to compromise and
no data to exfiltrate — so the meaningful question is never "can this instance be
attacked?" but rather:

> **Does the template hand a flaw to every project built from it?**

A weak default, an unsafe helper or a leaky workflow gets copied into every site that
starts from this repository. Those are the reports that matter, and they are taken
seriously.

## Supported versions

| Version                 | Supported |
| ----------------------- | --------- |
| `main` (latest commit)  | Yes       |
| Older commits and tags  | No        |
| Forks and derived repos | No        |

Only the current state of `main` receives fixes. There are no backports and no
long-term support branches: a template is meant to be cloned once, and after that the
copy belongs to whoever cloned it.

If your project was generated from an older commit, pull the fix into your own copy —
the maintainer of a repository created from this template is its own maintainer.

## In scope

Report anything in the template that would introduce a flaw into a project using it:

- **Content Security Policy weaknesses** in `src/lib/security-headers.ts` — a directive
  that is missing, too permissive, or bypassable in a way that enables script injection
  on a site shipping the default configuration.
- **Cross-site scripting through the sanitization helpers** in `src/lib/sanitize.ts` —
  a `javascript:`, `data:` or otherwise dangerous URL that survives the link sanitizer,
  or a JSON-LD payload that can break out of its `<script type="application/ld+json">`
  container.
- **GitHub Actions workflow flaws** — a workflow that leaks a secret into logs or into
  an artifact, evaluates untrusted pull request input inside a shell or a
  `${{ }}` expression, grants excessive `permissions`, or lets a fork's pull request
  reach privileged context.
- **Dockerfile flaws** — a secret baked into an image layer, a stage that runs as
  `root` when it should not, an unpinned or otherwise untrustworthy base image, or
  build context leakage through `.dockerignore` gaps.
- **A compromised pinned dependency** — a specific version in `package.json` /
  `package-lock.json` that is known to be malicious or backdoored.
- **A script that executes untrusted input** — anything under `scripts/`, in the
  `Makefile`, or in an npm lifecycle hook that can be made to run attacker-controlled
  commands.
- **Insecure defaults** in the shipped configuration that a user would reasonably
  assume are safe.

## Out of scope

These will be closed without a fix. They are listed explicitly so nobody spends time
writing them up:

- **Raw `npm audit` or Dependabot output with no demonstrated exploit path.** A
  transitive advisory in a build-time dev dependency, reachable only from code paths
  this template never executes, is not a vulnerability in this template. Dependabot
  already handles routine upgrades. Show how the flaw is reachable from the shipped
  code and it becomes in scope.
- **Missing rate limiting, brute-force protection or account lockout.** There is no
  backend, no login and no endpoint that accepts input. There is nothing to rate limit.
- **Absence of a hardening header with no demonstrated impact.** "Header X is not set"
  is a scanner finding, not a report. Explain the concrete attack the missing header
  enables here, given a fully static site.
- **Vulnerabilities in third-party platforms and frameworks** — Vercel, GitHub,
  Next.js, React, Node.js. Report those to the vendor through their own security
  process. A heads-up here is still welcome if the issue affects the template's
  defaults and there is something the template can do to mitigate it, but the fix
  belongs upstream.
- **Issues in a site built from this template.** Once cloned, the code is yours. Custom
  routes, added API handlers, third-party scripts, environment variables, deployment
  configuration and content are all outside this repository's control and outside this
  policy.
- Social engineering, physical attacks, denial of service through raw traffic volume,
  and self-XSS.

## Reporting a vulnerability

**Do not open a public issue for a security problem.** Public disclosure before a fix
exists puts every project using the template at risk.

Use one of these private channels:

1. **GitHub Security Advisories** (preferred) —
   <https://github.com/mauricioromagnollo/template-nextjs/security/advisories/new>.
   This creates a private thread visible only to you and the maintainer, and it is the
   fastest route to a coordinated fix and a CVE if one is warranted.
2. **Email** — <mauricioromagnollo@gmail.com>, with **`SECURITY`** in the subject line
   so it is not lost in the rest of the inbox.

### What to include

The more of this a report has, the faster it can be triaged and fixed:

- **Description and impact** — what the flaw is, and what an attacker gains from it in
  a project built from this template.
- **Affected file and line** — for example `src/lib/security-headers.ts:42`, or the
  specific workflow and step.
- **Reproduction steps** — the exact commands, requests or inputs, starting from a
  clean `git clone` and `npm ci`.
- **A minimal proof of concept** — the smallest payload, diff or snippet that
  demonstrates the problem. Please keep it non-destructive.
- **Your environment**, if relevant — OS, Node version, browser.
- **How you want to be credited** — name, handle or link, or a note that you prefer to
  stay anonymous.

## What to expect

| Stage              | Timeline                                                     |
| ------------------ | ------------------------------------------------------------ |
| First response     | Within about **5 business days**                             |
| Triage and verdict | Within about **10 business days** of the first response      |
| Fix and disclosure | Coordinated with you, as soon as a fix is ready and verified |

This is a solo, part-time project, so these are honest targets rather than contractual
guarantees. You will get a real answer either way: an accepted report gets a fix and,
where appropriate, a published advisory; a rejected one gets an explanation of why.

Please give the maintainer a reasonable window to ship a fix before disclosing
publicly. If a report goes unanswered past the timelines above, a public disclosure is
understandable — a nudge on the advisory thread first is appreciated.

## No bug bounty

There is no bug bounty program and no monetary reward. This is an unfunded open source
template maintained in spare time. What is offered instead is a prompt fix, a public
advisory, and credit in the advisory and in [CHANGELOG.md](CHANGELOG.md) for anyone who
wants it.

## Security practices already in place

Context for what the template already does, so reports can build on it rather than
rediscover it:

- **Security headers on every response.** `next.config.ts` applies the header set built
  by `src/lib/security-headers.ts` to all routes, including a Content Security Policy,
  `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy`.
- **Sanitization helpers.** `src/lib/sanitize.ts` filters `href` values to safe
  protocols and escapes JSON-LD payloads before they are serialized into a `<script>`
  tag.
- **Exactly pinned dependencies.** `.npmrc` sets `save-exact=true`, so `package.json`
  carries no version ranges, and every install — local, CI and Docker — runs `npm ci`
  against the committed lockfile. There is no window in which a fresh install silently
  resolves a different version than the one that was reviewed.
- **Least-privilege CI.** Every workflow declares `permissions: contents: read` at the
  top level and elevates only in the specific job that needs it. Every checkout sets
  `persist-credentials: false` so the ambient `GITHUB_TOKEN` is not left behind in
  `.git/config`. Untrusted pull request values are passed through the environment
  rather than interpolated into shell commands.
- **CodeQL** runs `security-and-quality` queries on every push, every pull request and
  weekly on a schedule, with results in the repository's code scanning tab.
- **Dependabot** watches npm dependencies, GitHub Actions and Docker base images
  weekly, with framework majors deliberately excluded so they are handled as reviewed
  migrations rather than automated bumps.
- **Hardened container images.** Both Docker stages pin the base image to an exact
  digestible tag (`node:24.16.0-slim`) and run as the unprivileged `node` user; the
  production stage copies only the traced standalone output, so no package manager or
  `node_modules` tree ships in the runtime image.
- **No build-time secrets.** The template needs none. The only build-time inputs are
  `NEXT_PUBLIC_*` variables, which are public by definition because Next.js inlines them
  into the client bundle. Nothing sensitive is ever required to produce a build.

## A note for projects built from this template

The moment you add a backend, an API route, authentication, a database or a third-party
script, this policy stops describing your project.

At minimum, before going to production:

- **Revisit the Content Security Policy.** The shipped policy is tuned for a static
  site. Adding analytics, an embedded widget, a payment provider or an inline script
  means auditing and extending the directives — and resisting the temptation to fix a
  console warning with `unsafe-inline` or a blanket wildcard.
- **Write your own security policy.** Replace this file with one that reflects your
  actual attack surface, your supported versions and your own reporting contact.
- **Treat every new input as untrusted.** Forms, query parameters, webhooks, uploads
  and CMS content are all attacker-controlled until validated on the server.
- **Keep secrets out of `NEXT_PUBLIC_*`.** Anything with that prefix is compiled into
  the JavaScript your visitors download.
- **Keep dependencies current.** The Dependabot configuration is already there; make
  sure someone is actually reviewing and merging what it opens.

Security issues in your site are yours to handle. This policy covers the template only.
