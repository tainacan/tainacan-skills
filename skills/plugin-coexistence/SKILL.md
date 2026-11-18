---
name: plugin-coexistence
description: Use when ensuring Tainacan/WordPress plugins coexist on the same site. Triggers on "plugin conflict", "one plugin breaks another", "activating plugin causes error", "name collision", "handle collision", "route collision", "CSS leak", "JS conflict", "sibling plugins", or when reviewing multiple plugins together.
---

# Plugin coexistence

## 1. Inventory and collisions

Scan the plugins directory for collisions:

- **Breaks**: repeated global function or class (fatal error), shortcode,
  post type, taxonomy, REST route, admin page or global JS object repeated,
  handle with different origin, `remove_all_*` on a hook another uses.
- **Review**: option or transient written by two plugins, same cron event.
- **Watch**: two plugins on the same sensitive hook (`tainacan-*`,
  `the_content`, `pre_get_posts`, `posts_*`, `rest_*`, `template_include`)
  with the same priority; order depends on who loads first.

## 2. Coexistence rules

- Own prefix on everything global; PHP namespace for classes.
- Never undo what belongs to others: no `remove_all_filters`, no deregistering
  jQuery/Vue/assets from Tainacan, no touching `$wp_filter`. To suspend a
  third-party callback (e.g. for printing), save and restore via the
  `WP_Hook` API in `try/finally`.
- Explicit priority when order matters, documented in the project's `AGENTS.md`.
- CSS always under the plugin's root class; no bare element selectors. Watch
  for `.button` from Bulma vs `.wp-core-ui .button`, `[hidden]` reappearing,
  `z-index` from Tainacan's lightbox, ancestor with `transform` breaking
  `position: fixed`.
- Assets only on the screens that use them (check `hook_suffix` or the presence
  of the block/shortcode). Moving a menu item changes the `hook_suffix`.
- Email: `phpmailer_init`/`wp_mail_from` only around your own `wp_mail()` call.
- Rewrite: do not call `flush_rewrite_rules()` on every load; on activation,
  only after registering your own types.
- Plugin that talks to another uses its **public API** (functions, filters,
  `is_*()` / getters), never the raw option or internal table. API providers
  publish a contract version number and maintain compatibility.
- Two plugins on the same data (taxonomy, meta, index): define who owns it
  and how the other reads.
- Renamed plugin: deactivate old before activating new (duplicate hooks).

## 3. Joint review of multiple plugins

For N plugins that live together:
1. Run collision detection and resolve the "Breaks".
2. Build the sensitive-hook map with priorities and decide the order.
3. Activate all in the test environment with real data and walk through: item
   page, faceted search, item admin, collection admin, REST, print, import.
   Browser console clean and `debug.log` without new warnings.
4. Record coexistence decisions in each plugin's `AGENTS.md`.

## Report

Collisions found (with the command), order and ownership decisions, what was
tested together and the result.
