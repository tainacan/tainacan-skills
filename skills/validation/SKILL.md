---
name: validation
description: Use to run delivery checks on a Tainacan/WordPress project before commit or deploy. Triggers on "validate", "run the tests", "lint", "check before pushing", or when a pre-commit hook or CI fails.
---

# Validation

Run in the repository root and save the output of each step for the response.

## Order

1. **Static analysis on changes**
   - `--changed` for unstaged files, `--staged` for the index, `--diff=origin/develop`
     for the entire branch against the base.
   - **Block**: fix. Never suppress a security block without demonstrating why
     it is safe.
   - **Warning**: fix or justify inline (`// ignore: concrete reason`).

2. **Syntax**: `php -l` on changed files. If the project declares a minimum PHP
   lower than the local one, avoid new syntax (`match`, `enum`, `readonly`,
   named arguments, `?->`) and note in the response that you could not test on
   the minimum version.

3. **Project standards**, when present:
   - `vendor/bin/phpcs` (configuration `phpcs.xml.dist`).
   - `vendor/bin/phpstan` (configuration `phpstan.neon*`).
   - `vendor/bin/phpunit` or the project test script.
   - JS/Vue changed: `npm run lint` and `npm run build`.

4. **Plugin Check**, when the plugin goes to WordPress.org or the diff touches
   output, input, SQL, i18n or enqueue. See the `wordpress-org` skill.

5. **Before commit going to deploy**: two-layer review on the diff
   (`code-review` skill).

6. **Release**, if the change bumps the version: run release checks.

Missing tool (no `vendor/`, no test database): do not install anything without
asking. Record as pending with the command the person needs to run.

## Report format

```
- [x] static analysis --changed -> PASS: 0 block(s), 0 warning(s) in 4 file(s)
- [x] phpunit --filter Fixture -> OK (12 tests, 30 assertions)
- [ ] manual test in admin -> pending: open Items > Edit and check the new field
```

Never declare delivery complete with an open block or with a mandatory check
not executed.
