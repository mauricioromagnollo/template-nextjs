# ADR-NNNN — Short title in the imperative

!!! note "How to use this page"

    Copy it, do not edit it in place:

    ```bash
    cp docs/decisions/template.md docs/decisions/0005-my-decision.md
    ```

    Then replace `NNNN` with the next unused number, delete this admonition and the italic prompts,
    add the file to `nav:` in `mkdocs.yml`, and add a row to the table in
    [the index](index.md#records).

## Status

**Accepted** — 2026-07-25

*One of `Proposed`, `Accepted`, `Deprecated`, or `Superseded by ADR-000X` (linked to the record that
replaced it), followed by the date the status last changed. Numbers are never reused: superseding a
record means writing a new one, not editing the old one.*

## Context

*What forced the decision? Write this so that someone who would have chosen differently still
recognises their own problem in it.*

*Cover:*

- *The requirement or constraint that made a choice necessary.*
- *The alternatives that were genuinely considered — with what each one would have cost. An ADR
  listing only the option that won is a press release.*
- *Any assumption that, if it turned out to be wrong, would invalidate the decision. This is what
  tells a future reader when to revisit.*

*Do not state the decision here. Context is the problem; the next section is the answer.*

## Decision

*What was chosen, in the active voice and one paragraph: "We use X."*

*Then the mechanics — the specific configuration, the file it lives in, the rule that enforces it:*

```ts title="path/to/file.ts"
// The concrete change, so a reader can find it.
```

## Consequences

### Positive

- *What this makes possible or cheap.*
- *Concrete effects, not adjectives. "The runner image needs no `node_modules`" beats "cleaner".*

### Negative

- *What this makes harder, slower or more expensive. Be specific.*
- *The strongest argument against the decision, stated fairly — not a straw man you can knock over.*
- *Who pays the cost, and when.*

### Neutral

- *Consequences that are simply different, not better or worse. Optional.*

## Revisit if

*The conditions under which this decision should be reconsidered. This is the section that makes an
ADR useful two years later: "if the team grows past X", "if build times exceed Y", "if the framework
ships a native equivalent".*

## Opting out

*How to undo it. Which file to edit, which lines to delete, what breaks if you do. A template's
readers inherit these decisions without having been in the room, so give them an exit.*
