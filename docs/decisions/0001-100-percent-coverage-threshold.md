# ADR-0001 — Require a 100% test coverage threshold

## Status

**Accepted** — 2026-07-25

## Context

The template needs a coverage policy. Every project that measures coverage picks a number, and the
number determines what actually happens over the following year.

**The problem with a partial threshold.** Set it to 80% and you have declared that 20% of the code
does not need to be tested — without saying which 20%. In practice the untested fifth is not chosen;
it accumulates. The modules that are awkward to test are exactly the ones that get skipped, and they
are disproportionately the ones with the interesting logic. Worse, a partial threshold *degrades
silently*: a pull request that adds 200 lines with no tests, to a codebase sitting at 92%, may still
land at 87% and pass. Nobody sees a red check; the ratchet only turns one way, and it turns down.

**Coverage is a floor, not a proof.** The standard objection to 100% coverage is correct and worth
stating in full: covering a line means it *executed* during a test, not that its behaviour was
*asserted*. A suite that renders every component and asserts nothing reaches 100% and proves
nothing. Coverage cannot detect a missing test case, a wrong boundary, an unhandled input the code
never anticipated, or a race. Chasing the number can actively harm a suite — producing tests written
for the instrumenter rather than for the reader, and encouraging mocks that assert the
implementation instead of the behaviour.

**What is specific about this codebase.** The template is small (a few dozen modules), mostly pure
functions and presentational components, and has no database, no authentication and no third-party
API. There is no genuinely untestable surface — no `catch` block that only fires when the network
partitions, no vendor SDK that has to be faked wholesale. The usual reason a real application cannot
reach 100% simply does not apply here.

**And it is a template.** Whatever number ships is the number every project created from it inherits
on day one. A threshold of 80 in a repository with 100% actual coverage means the first twenty
percent of untested code arrives for free, and the decision to allow it is never made by anyone.

Alternatives considered:

| Option | Why not |
| --- | --- |
| No threshold, report only | The report becomes wallpaper. Nothing fails, so nothing changes. |
| 80% global | Erodes silently, as described. Also invites the "which 80%?" question with no answer. |
| Ratcheting threshold (never below the current value) | Better than a fixed 80%, but needs tooling or a committed baseline file, and it still permits new untested code as long as the ratio holds. |
| Per-file thresholds | Solves the "one giant tested file hides five untested ones" problem, but adds a config entry per file and turns every new module into a config edit. |
| **100% global** | Chosen. |

## Decision

We require **100% coverage on statements, lines, branches and functions**, enforced by Vitest's v8
provider, with a short and technically justified exclusion list.

```ts title="vitest.config.ts"
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    // Barrels only re-export; there is nothing to cover in them.
    'src/**/index.ts',
    'src/**/*.d.ts',
    // Type-only modules erase at compile time, so v8 instruments them with
    // an empty denominator (0/0) and reports that as 0%.
    'src/types/**',
  ],
  thresholds: {
    statements: 100,
    lines: 100,
    branches: 100,
    functions: 100,
  },
},
```

`npm run test:coverage` is part of `npm run check` locally, and the `quality` job in CI runs the
same script as a step of its own. A module added without a spec does not lower a percentage — it
turns the pull request red.

### The exclusions, and why each is technical

`src/**/index.ts`
: A barrel is a list of `export … from` statements. No branches, no functions, no runtime behaviour
of its own. Its correctness is proven by the fact that anything importing through it compiles.

`src/**/*.d.ts`
: Ambient declarations. No emitted JavaScript at all.

`src/types/**`
: Type-only modules erase entirely during compilation. The v8 provider instruments the resulting
empty file with a denominator of zero and reports `0%` — a measurement artefact that would make the
threshold unreachable for reasons unrelated to testing.

None of the three is "this was hard to test". That distinction is the whole discipline: an exclusion
must be a fact about the compiler, not about the schedule.

## Consequences

### Positive

- **The gate cannot erode.** There is no gradual slide, because there is no room below the line.
  Every module in `src/` has a spec, permanently.
- **The failure arrives at the right moment** — in the pull request that introduced the gap, while
  the author still has the context, instead of in a quarterly "we should improve coverage" push that
  never happens.
- **Design pressure.** A module that is genuinely hard to cover is usually a module doing too much or
  reaching for a global. The threshold surfaces that on day one, which is when it is cheap to fix.
- **Dependency upgrades get a real signal.** Dependabot opens a pull request weekly; a suite that
  executes every line of the codebase catches a surprising share of breaking minor releases.
- **The exclusion list is short and reviewable.** Three entries, each with a comment. Someone
  reading `vitest.config.ts` can audit the entire compromise in ten seconds.
- **A newcomer knows the rule immediately.** "Every module has a spec" needs no interpretation.
  "Keep coverage reasonable" needs a meeting.

### Negative

- **100% coverage does not mean the code is correct.** This is the strongest argument against the
  decision and it is entirely true. Coverage measures execution, not assertion. A suite can reach
  100% while asserting nothing of value, and the threshold will happily certify it. Mutation testing
  measures assertion quality; coverage does not, and no threshold value fixes that.
- **It can incentivise bad tests.** The pressure to close a red line encourages a test written to
  satisfy the instrumenter — rendering a component and expecting it "not to throw", or asserting an
  implementation detail because the behaviour is inconvenient to reach. Reviewers have to watch for
  this; the number will not.
- **The final few percent are the expensive ones.** Error branches, defensive `catch` blocks and
  defaults that "cannot happen" are exactly the hardest cases, and they are where the tests deliver
  the least insight per hour spent.
- **It scales badly.** This works because the codebase is small and pure. Bolt on a payment provider,
  an email service and an OAuth flow, and the honest options become "mock heavily" (tests that assert
  the mocks) or "exclude" (the erosion this ADR exists to prevent). At that point, revisit.
- **Contribution friction.** A drive-by contributor fixing a one-line bug must also write a spec, or
  their pull request is red. That is a real barrier for an open-source template, and one this ADR
  accepts knowingly.
- **v8 coverage is not perfectly precise.** Its byte-range mapping can attribute coverage oddly
  around decorators, transpiled generators and some TSX edge cases. Occasionally you will chase a
  line that is provably executed. Switching the provider is the escape hatch, not lowering the
  number.

### Neutral

- Coverage is reported in three formats: `text` for the terminal, `html` for a browsable report, and
  `lcov` for editor gutters and external services.
- CI uploads `coverage/` as an artifact on both success and failure — a threshold violation is
  precisely when a reviewer wants the report.
- The end-to-end suite is deliberately **not** counted toward coverage. Playwright drives a
  production build in a real browser; folding it in would let a smoke test paper over missing unit
  tests, which is the same erosion by a different route.

## Revisit if

- The project acquires a substantial I/O surface — a database, an auth provider, a payment gateway —
  where reaching 100% would mean mocking more than testing.
- The exclusion list starts growing for reasons that are not compiler facts. Each new entry is a
  signal that the policy no longer fits the codebase.
- Contributor friction becomes measurable: pull requests abandoned at the coverage gate.
- Mutation testing (Stryker) becomes practical here. It measures what coverage cannot, and with it in
  place a lower coverage threshold would carry more information than 100% does today.

## Opting out

Lower or remove the thresholds in `vitest.config.ts`:

```ts
thresholds: {
  statements: 80,
  lines: 80,
  branches: 75,
  functions: 80,
},
```

Deleting the `thresholds` block entirely keeps the report and removes the gate. Nothing else in the
template depends on the number: `npm run test:coverage` still runs, CI still uploads the report, and
`npm run check` still passes or fails on the tests themselves.

If you lower it, pick the number deliberately and write down why — otherwise you have replaced a
considered decision with a default, which is the situation this record exists to prevent.
