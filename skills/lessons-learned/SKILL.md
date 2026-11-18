---
name: lessons-learned
description: Use to transform a resolved problem into reusable team knowledge. Triggers on "remember this", "this happened before", "record the lesson", "register finding", or in review when a repeatable pattern is found.
---

# Lessons learned

The goal is that the same error does not cost time again, in any project.

## 1. Worth recording?

Record if: the cause was understood; it can recur (in another file, plugin or
person); and it cost investigation. Do not record typos, one-off external
service failures or something the code already makes obvious.

## 2. Where to record

| Situation | Destination |
|---|---|
| Pattern detectable in code (call X without Y, key Z, hook W) | Automated rule + fixtures + lesson reference |
| Applies to any Tainacan project, but not detectable | Reference document (format `### L-<TOPIC>-NN`) |
| Only applies to this project | Project `AGENTS.md` ("Gotchas" or "Do not regress") |

## 3. Reference lesson format

```
### L-<TOPIC>-NN - <short title>
**Symptom:** ... **Cause:** ... **Fix:** ... **Detection:** manual: <how to verify> **Seen in:** <project type>
```

No names of people, servers, internal domains, IPs or customer data.

## 4. Creating an automated rule

1. Choose the ID by category (B base, S security, P performance, T Tainacan,
   W WordPress, C coexistence) with the next free number.
2. Create the rule class with ID, title, severity, category, extensions and
   docblock explaining the cause (cite the core with file:line).
3. Block only what breaks for certain or is a demonstrable security flaw with
   external data; everything else is a warning. Prefer not flagging over
   flagging wrong.
4. Create fixtures: cases that should flag (annotated with `// @expect <ID>`)
   and similar cases that should **not** flag.
5. Register the class. Run tests until 0 failures.
6. Measure noise on real code: run on a folder with real plugins. Read a sample;
   if there are false positives, adjust the rule and add the case as a
   non-flagging fixture.
7. Write the lesson document (Symptom, Cause, What the rule detects, How to fix,
   When to suppress, Origin).

## 5. Propagate

With the rule ready, run it on workspace plugins and list where the problem
exists. Fix each in its own repository or open an issue for the responsible
person.

## Report

Where the lesson was recorded, rule ID (if any), scan results on other plugins.
