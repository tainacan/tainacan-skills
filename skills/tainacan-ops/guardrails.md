
# Guardrails

Standard code change workflow. Other skills (hooks-and-extensions, rest-api,
performance, collection-migration) complement when the task touches their area.

## 1. Understand before editing

- Read the project section in `AGENTS.md` (state, environment, gotchas,
  "do not regress").
- Read in full each file that will change. Find who calls the changed code
  (`grep -rn "function_name"`), including JS and templates.
- If the change touches Tainacan, open the core section you will use and verify
  the signature. Do not trust version memory.
- Declare assumptions. Ambiguity that changes the result: stop and ask.

**Stop and ask if:** the request admits two readings with different results; the
change requires modifying Tainacan core or WordPress core; the fix changes
stored data (migration); there is a conflict between the request and the
project's "do not regress".

## 2. Plan

Before the first edit, write:

```
**Scope:** files that change and why
**Risks:** stored data, coexistence with other plugins, performance on large
           collections, security
**Checklist:**
- [ ] <step> -> verification: <concrete command or observation>
- [ ] static analysis without blocks -> verification: run checks on changed files
```

Translate the request into a testable criterion:
- "Fix the bug": reproduce first; then fix; then repeat the reproduction.
- "Add validation": list invalid inputs and prove each one.
- "Improve performance": measure before and after with the same command
  (see `performance` skill).

## 3. Implement

- Follow the file's style (names, comments, array format, quotes).
- Prefix everything global with the plugin prefix: functions, classes (or
  namespace), constants, options, transients, handles, AJAX actions, REST
  routes, CSS classes.
- **Hierarchy for any lint or security warning: refactor > use the canonical
  WordPress/Tainacan API > suppress with technical justification.** Suppression
  without explaining why the alternative does not work is invalid.
- Persistence: `wp_insert_post`/`get_post_meta`/`WP_Query` -> Tainacan
  repositories -> `$wpdb` only for custom table or aggregation, with
  `prepare()`.
- Input: `sanitize_*( wp_unslash( ... ) )`/`absint`. Output: escape **at the
  echo line** with `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`. SQL:
  `$wpdb->prepare()`. Writes: nonce + `current_user_can`.
- Dates: `gmdate()` for database and calculation, `wp_date()` for display;
  never `date()`. Use `wp_json_encode`, `wp_remote_get`, `wp_delete_file`,
  `wp_rand`, `WP_Filesystem` instead of native functions. `error_log()` only
  under `WP_DEBUG`.
- User-visible text goes through `__()` with the plugin domain.

## 4. Verify and deliver

Run validation checks. Blocks prevent delivery. Warnings: fix or justify inline.

Final response:
1. What changed, one or two sentences per file.
2. Checklist with `[x]` + command + result, or `[ ]` + reason.
3. Pending items and what requires manual testing (with step-by-step).
4. Issues found outside scope, as observations only.
