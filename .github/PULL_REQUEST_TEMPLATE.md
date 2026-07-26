<!--
Thanks for contributing! Fill in the sections that apply and delete the ones
that do not. A focused pull request with a clear description gets reviewed a lot
faster than a large one that explains itself only through the diff.
-->

## Description

<!-- What does this change do, and why is it needed? Describe the behaviour
before and after, not the list of files you touched. -->

## Related issue

<!-- Link the issue this closes, e.g. "Closes #42". If there is no issue,
write "N/A" and explain the motivation in the description above. -->

Closes #

## Type of change

<!-- Check every type that applies. These mirror the Conventional Commit types
accepted by `commitlint.config.mjs`. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `style` — formatting, no behaviour change
- [ ] `refactor` — restructuring without behaviour change
- [ ] `perf` — performance improvement
- [ ] `test` — adding or fixing tests
- [ ] `build` — build system or dependencies
- [ ] `ci` — CI configuration
- [ ] `chore` — maintenance
- [ ] `revert` — reverts a previous commit
- [ ] Breaking change (`!` in the commit type, or a `BREAKING CHANGE:` footer)

## Checklist

<!-- These are the exact gates the CI workflow enforces. Running `npm run check`
covers the first four locally. -->

- [ ] `npm run format:check` passes
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run typecheck` passes
- [ ] `npm run test:coverage` passes and coverage is still 100%
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes (run `npm run test:e2e:install` first)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] Documentation under `docs/` and the `README.md` are updated if the change affects them
- [ ] New behaviour is covered by tests, and the tests fail without the change

## Screenshots

<!-- Required for any user-visible change. Delete this section otherwise.
Include both light and dark themes when the change is visual. -->

| Before | After |
| ------ | ----- |
|        |       |

## Notes for reviewers

<!-- Anything that helps the review: trade-offs you weighed, alternatives you
rejected, parts you are unsure about, follow-up work you deliberately left out,
or manual steps needed to verify this locally. -->
