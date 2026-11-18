---
name: core-contribution
description: Use when working on the Tainacan core repository (github.com/tainacan/tainacan). Triggers on "contribute to core", "PR to develop", "core tests", "GitFlow", "build.sh", "modify the core", "Tainacan repository", or when evaluating if a core change breaks existing plugins.
---

# Contributing to Tainacan core

Check the repository's own `CONTRIBUTING.md`, `package.json`, `phpunit.xml.dist`
and `.github/` — they prevail over this summary.

## Structure and build

- The distributed plugin is `src/`; everything outside it is tooling. Composer
  `vendor` goes in `src/vendor`.
- `build.sh` (reads `build-config.cfg`) installs dependencies, compiles Sass,
  runs webpack and copies `src/` to `wp_plugin_dir`, removing `.vue/.js/.scss`
  sources from `views/`. That is why an installation lacks Vue sources.
- npm scripts: `build` (development), `build-prod`, `lint`, `lint:vue`,
  `lint:js`. ESLint also runs in the build.
- PHPCS: `composer phpcs` (WordPress-Core + WordPress-Docs).

## Tests

```sh
./tests/bin/install-wp-tests.sh wordpress_test root "" 127.0.0.1:3306 latest
cp tests/bootstrap-config-sample.php tests/bootstrap-config.php
phpunit
```

Files `tests/test-*.php`; those prefixed with `_` are excluded. There are no JS
or e2e tests: Vue changes require a manual test plan in the PR.

## Workflow

- Work on a **fork** (`origin` = fork, `upstream` = tainacan/tainacan). Any
  `git push` to an upstream branch, `merge` into `develop`/`master` of
  upstream, tag that goes to upstream, `push --force` or opening a PR on
  someone else's behalf requires **explicit confirmation** from the requester.
- GitFlow: work on `feature/<topic>` from `develop`; PR against `develop`,
  after `git rebase upstream/develop`. Never commit directly to `develop` or
  the production branch.
- Commits in Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`,
  `chore`, `perf`, `ci`), subject under 72 characters.
- PR template: related issue, change type, ESLint/PHPCS, tests, screenshots;
  **changed block (`block.json` or `save.js`) requires updating `deprecated.js`**.

## Plugin compatibility

The core is the base for many plugins. Before changing a signature, hook, option
key, REST route, JS event name, CSS class used by a theme, `metadata_type_options`
format or repository behaviour:

- Search for usage in known plugins (inventory scan on a folder with plugins;
  `grep` by hook name).
- Keep the old working with a deprecation notice (`_deprecated_hook`,
  `_deprecated_function`) for at least one minor version.
- Record in the changelog the change and the migration path for plugins.
- New hook: name with `tainacan-` prefix, arguments documented in docblock.

## Version differences (1.0.x vs 1.4.x)

Key differences to watch:
- Logs: 1.4.x has the heartbeat/watchdog fix with UTC normalisation.
- `perpage=-1`: in 1.0.x passes without limit; in 1.4.x caps to configured max.
- `tainacan_get_the_document()`: 1.0.3 passes id as image size argument.
- Background process timestamps: 1.4.x normalises to UTC.

Always check the actual core code for the version the project supports.
