---
name: diagnostics
description: Use when investigating a bug with no known cause in a Tainacan/WordPress site or plugin. Triggers on "white screen", "500 error", "REST broken", "count mismatch", "empty field", "hook not firing", "sudden slowdown", "works in one environment but not another", "debug", "investigate".
---

# Diagnostics

## Principle

Root cause before fix. One hypothesis at a time, each with a test that confirms
or rules it out. Record what was ruled out to avoid repeating paths.

## 1. Reproduce

- Write the minimal reproduction: URL, user/role, input data, expected vs actual
  result.
- Capture the real error: `WP_DEBUG` + `WP_DEBUG_LOG` (`wp-content/debug.log`),
  browser console, Network tab (REST response, `X-WP-Total`,
  `X-Tainacan-Query-Time` headers), `wp eval`.
- Compare environments: WordPress version, Tainacan version (1.0.x vs 1.4.x
  differ in logs, `perpage` and `tainacan_get_the_document`), PHP version and
  active plugin list.

## 2. Check known issues first

Before investigating from scratch, search for the symptom in known lessons and
references.

Classic symptoms and where to look:
- "headers already sent", redirect that does not happen, HTML at start of
  response: output before header (BOM, hook that prints, space after `?>`).
- Metadatum option field always empty: check option key indexing.
- Admin or faceted search hook not appearing: check hook registration and timing.
- Exception "Entities must be validated": missing `validate()` call.
- Entire REST API down after activating a plugin: route with `@` in pattern,
  fatal in `rest_api_init`.
- Count differs between list, filter and index: compare source x database x
  index separately.
- Tainacan items return 404 after activating something: rewrite rules flushed.
- Broken accents: encoding issue (BOM, Latin-1/CP1252 vs UTF-8).

## 3. Isolate

- **Plugin conflict**: deactivate all except Tainacan and the suspect; reactivate
  one by one. Check for name, handle, route, option and sensitive hook collisions.
- **Regression**: `git bisect` between the last good version and the bad one,
  with the reproduction as the test.
- **Data vs code**: is the problem in the stored data or in the code that reads
  it? Read the raw value (`get_post_meta`, `wp db query` read-only) before
  changing code.

## 4. Fix and prove

The reproduction from step 1 becomes the acceptance criterion. Repeat it after
the fix and show the result.

## 5. Check for the same defect elsewhere

If the cause is a code pattern, verify neighbouring plugins with grep or static
analysis.

## Report

Symptom, root cause (file:line), why it only appeared under certain conditions,
fix, proof, other affected locations, lesson recorded (yes/no).
