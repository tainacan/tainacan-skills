---
name: release
description: Use when publishing a Tainacan plugin or theme version. Triggers on "release", "publish version", "bump version", "generate ZIP", "tag release", or before publishing to WordPress.org or a server.
---

# Release

## Pre-release checks

- Version is identical across: plugin header, `*_VERSION` constants, `Stable tag`
  in `readme.txt`, `package.json` and `composer.json`.
- `readme.txt` fields are complete (`Requires at least`, `Tested up to`,
  `Requires PHP`, `Stable tag`, `License`).
- Changelog mentions the version.
- Text Domain matches the slug.
- Extensions declare `Requires Plugins: tainacan`.
- Cron events are cleaned on deactivation.

## Checklist

- [ ] Version follows the project's semver (fix = patch; feature = minor;
      breaking change = major).
- [ ] Changelog describes what changes for users, not the commit list.
- [ ] Data migration: idempotent, versioned (option with schema version),
      tested on a production copy; and how to rollback.
- [ ] Cached configuration maps include a version number: changing the rule
      without invalidating the cache has no effect on existing installs.
- [ ] Assets: `npm run build` (production) and `composer install --no-dev`
      when the package includes `vendor/`. ZIP built from git (`git archive`)
      plus build artefacts, never from a dirty working directory; no
      `node_modules`, tests, `.git`, `.agents/` or development files.
- [ ] Clean install of the ZIP on a test WordPress activates without warnings,
      and updating over the previous version preserves data.
- [ ] Renamed plugin: instructions to deactivate the old one before activating
      the new one.
- [ ] Edge cache (Varnish, CDN): purge plan after deploy.
- [ ] Plugin going to WordPress.org: `wordpress-org` skill with zero errors in
      Plugin Check; `readme.txt` with External services if any.
- [ ] Two-layer review on the release diff (code-review skill).
- [ ] Commit messages in Conventional Commits, in English (`fix(area): ...`).
- [ ] Git-flow: `release/X.Y.Z` from `develop`, versions adjusted, production
      build, `merge --no-ff` into `master`/`main`, annotated tag `vX.Y.Z`,
      merge back into `develop`. Never push to upstream branch without explicit
      confirmation.
- [ ] Tag in git (`vX.Y.Z`) and push the tag; release with changelog and
      lean ZIP.

## Report

Version, what went in, verification results, where it was tested, generated
artefact (path and hash) and the rollback step.
