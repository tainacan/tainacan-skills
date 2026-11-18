---
name: code-review
description: Use for technical code review of Tainacan/WordPress diffs, PRs, branches, commits or entire modules. Triggers on "review", "code review", "analyse this PR", "audit", "security review", or before approving a merge.
---

# Code review

## Input

Define the target and write it at the top of the report: PR (`gh pr diff <n>`),
branch against base (`git diff origin/develop...HEAD`), commits, files or an
entire module. If unclear, ask.

## 1. Automated triage

Run static analysis on the diff or module to surface issues before manual review.
Output is **triage**, not verdict: each finding will be confirmed or discarded
in the reading.

## 2. Reading by role

Read the full diff and the context of each changed section (the entire function
and who calls it). Apply these review lenses:

| Role | When |
|---|---|
| Security | Input, output, SQL, REST, AJAX, upload, permissions |
| Performance | Queries, loops, listings, import, index |
| Tainacan API | Entities, repositories, hooks, Tainacan REST |
| Coexistence | Global hooks, CSS/JS, assets, options, global names |
| Release | Version change, migration, uninstall |
| WordPress.org | Plugin going to directory, or echo/input/SQL/i18n/enqueue |
| Correctness | Logic, edge cases, regression, concurrency |

## 3. Evidence rule

- **Confirmed** finding: file:line, the concrete scenario that fails
  (input -> wrong result) and, for security, the data path from input to use
  with file:line at each step.
- Without this, the finding is a **hypothesis** and appears separately.
- Pre-existing debt outside the diff does not block, unless the change amplifies
  it.

## 4. Report format

```
## Technical review: <target>
**Verdict:** approve | approve with reservations | request changes
**Triage:** <summary>

### Blockers (fix before merge)
1. `file.php:42`: <defect in one sentence>. Scenario: <input -> result>.
   Fix: <what to do>.

### Reservations (fix or justify)
### Hypotheses (verify)
### Observations out of scope
```

Order by severity. Be specific; nothing like "consider improving readability".
If the PR has no tests for new behaviour, that is a reservation.
