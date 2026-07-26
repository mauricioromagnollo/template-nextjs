# Architecture Decision Records

## What an ADR is

An **architecture decision record** is a short document capturing one significant decision: the
situation that forced it, what was chosen, and what that costs.

It is written *when the decision is made*, not reconstructed afterwards, and it is never edited to
reflect a change of mind — a superseded record keeps its content and gains a status line pointing at
its replacement. The archive is a record of how the thinking evolved, which is more useful than a
document that always agrees with the current code.

The format here is [MADR](https://adr.github.io/madr/), trimmed to four sections:

| Section | Contains |
| --- | --- |
| **Status** | `Proposed`, `Accepted`, `Deprecated`, or `Superseded by ADR-000X`, with a date. |
| **Context** | The forces at play — constraints, requirements, the alternatives considered. Written so that someone who would have decided differently still recognises the problem. |
| **Decision** | What was chosen, stated in the active voice: "We use X". |
| **Consequences** | What follows — the good and the bad. The negative list is the part future readers need most. |

## Why bother in a template

A template is opinionated by definition, and an unexplained opinion is indistinguishable from an
accident. Someone who clones this repository will hit a 100% coverage threshold on their second day
and want to know whether it is a considered trade-off or something the author forgot to turn down.

These records answer that. Each one ends by telling you what to change if you disagree — because
disagreeing on purpose is a perfectly good outcome, and it is what a starting point is for.

## When to write one

Write an ADR when the decision:

- is **expensive to reverse** — a framework, a rendering strategy, a deployment target;
- **constrains everyone's future work** — a lint rule, a coverage floor, a directory convention;
- was chosen **over a reasonable alternative**, and a newcomer would ask why;
- is one you have already **explained twice in code review**.

Do not write one for a fact ("we use TypeScript"), a preference with no downstream consequence
(tab width), or something a code comment covers adequately. This directory should stay short enough
to read in one sitting.

The mechanics — numbering, the template, adding it to the navigation — are in the
[documentation guide](../guides/documentation.md#writing-an-adr).

---

## Records

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-100-percent-coverage-threshold.md) | Require a 100% test coverage threshold | Accepted |
| [0002](0002-tailwind-v4-css-first-design-tokens.md) | Tailwind v4 CSS-first with semantic design tokens | Accepted |
| [0003](0003-barrel-imports-enforced-by-eslint.md) | Enforce barrel imports with ESLint | Accepted |
| [0004](0004-standalone-output-and-docker.md) | Ship `output: 'standalone'` and a production Dockerfile | Accepted |

Use [the template](template.md) for a new one.
