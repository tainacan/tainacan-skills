---
name: tainacan-ops
description: Quality assurance, code review, release management and contribution workflow for Tainacan. Load when reviewing code, preparing a release, running validation, diagnosing bugs, or contributing to core. Triggers on "review", "release", "validate", "lint", "phpcs", "Plugin Check", "diagnose bug", "git-flow", "semver", "WordPress.org", "contribute to core", "PR template", "pre-commit", "code review", "guardrails".
---

# Tainacan ops

Everything for quality assurance, code review, release management, bug
investigation and contributing to the Tainacan core repository.

## Safe code change workflow (guardrails)

1. **Understand** — read the code, trace the flow, identify all callers.
2. **Plan** — define verifiable success criteria before changing anything.
3. **Implement** — security hierarchy: never weaken validation, always escape
   output, preserve capability checks.
4. **Verify** — run the test suite, check edge cases, confirm no regressions.

## Validation checklist (pre-commit order)

1. Static analysis / lint (`npm run lint`, `composer phpcs`)
2. PHP syntax check (`php -l`)
3. Project standards (naming, escaping, capability checks)
4. Plugin Check (`wp plugin check tainacan`)
5. PHPUnit test suite (`make test`)
6. Manual review of changed UI

## Code review by role

| Role | Focus |
|---|---|
| Security | Input validation, output escaping, capability checks, SQL injection |
| Performance | N+1 queries, `perpage=-1`, missing `fetch_only`, large taxonomy terms |
| Tainacan API | Repository pattern, autoloader compliance, hook naming, REST conventions |
| Coexistence | Prefixing, conditional enqueue, CSS scoping, no `!important` |
| Correctness | Edge cases, error handling, backward compatibility |

Evidence rule: every finding is **confirmed** (reproducible) or **hypothesis**
(plausible but unverified). Never present a hypothesis as confirmed.

## Bug investigation (diagnostics)

1. **Reproduce** — exact steps, expected vs actual, environment details.
2. **Check known issues** — search existing bugs, lessons learned, changelogs.
3. **Isolate** — plugin conflict test, `git bisect`, data vs code.
4. **Fix and prove** — targeted fix, regression test, verify the original report.

## Release workflow

Semver. GitFlow: `release/<version>` from `develop`, merge to both `master` and
`develop`. Checklist: changelog, version bump, `build.sh --prod`, ZIP, tag.

## Contributing to core

Fork workflow, branch from `develop`, rebase before PR. Conventional Commits.
Changed Gutenberg block → update `deprecated.js`.

## Sub-skills

| File | Covers |
|---|---|
| [guardrails.md](guardrails.md) | Safe code change workflow: understand, plan, implement, verify |
| [validation.md](validation.md) | Pre-commit/delivery checks: lint, phpcs, tests, Plugin Check |
| [code-review.md](code-review.md) | Technical review by role: security, performance, correctness |
| [diagnostics.md](diagnostics.md) | Bug investigation: reproduce, isolate, fix and prove |
| [release.md](release.md) | Version publishing: checklist, semver, build, ZIP, tag, git-flow |
| [wordpress-org.md](wordpress-org.md) | Plugin Check compliance, directory review, readme |
| [core-contribution.md](core-contribution.md) | Contributing to tainacan/tainacan: GitFlow, tests, PR template |
| [lessons-learned.md](lessons-learned.md) | Capturing reusable knowledge: rules, references, project notes |
