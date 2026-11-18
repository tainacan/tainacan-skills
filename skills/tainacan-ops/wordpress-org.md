
# WordPress.org compliance

## 1. Run the official tool

In order of preference, saving the output:

1. **Plugin Check on a local WordPress** (same as the directory uses):
   ```
   wp plugin install plugin-check --activate
   wp plugin check <slug> --exclude-directories=node_modules,vendor,tests --format=table
   ```
2. **PHPCS with the strict ruleset** (`phpcs.xml.dist`):
   `composer install && vendor/bin/phpcs`.
3. **Neither available**: use grep-based checks for the most common issues.

## 2. Treat each finding by hierarchy

For each code, in this order — only advance when the previous step does not apply:

| Finding | 1. Refactor | 2. Canonical function | 3. Suppress (last resort) |
|---|---|---|---|
| `EscapeOutput` | Escape at the `echo` line | `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post` | Only non-HTML output (CSV, JSON with header), with reason |
| `ValidatedSanitizedInput` | Read once at handler top | `sanitize_*( wp_unslash( ... ) )`, `absint` | Never |
| `NonceVerification` | Nonce in form/AJAX | `check_ajax_referer`, `wp_verify_nonce` | With documented justification |
| `DirectDatabaseQuery` | `WP_Query`, `get_posts`, Tainacan repository | `$wpdb->prepare()` | Custom table or aggregation, with reason |
| `AlternativeFunctions` | — | `wp_json_encode`, `wp_remote_get`, `WP_Filesystem`, `wp_delete_file`, `wp_rand`, `gmdate`/`wp_date` | Large stream or binary, with reason |
| `DevelopmentFunctions` | Remove | `if ( WP_DEBUG )` guard | Guarded by WP_DEBUG |
| `Offloading` (CDN) | Copy to `assets/vendor/` | `plugins_url()` | Only services without local equivalent (reCAPTCHA), declared in readme |
| `I18n.*` | Single domain, `translators:`, `%1$s` | `esc_html__`, `wp_set_script_translations` | Never |

Every suppression includes the sniff code and a technical reason.

## 3. What the tool does not see (human review)

- Complete `readme.txt`: `Stable tag` = version, `Requires at least`,
  `Requires PHP`, `Tested up to`, `License`; **External services** section for
  every third-party call (what is sent, when, link to terms and privacy).
- Header: `Requires Plugins: tainacan` for extensions; name and slug without
  third-party trademarks.
- `uninstall.php` (or `register_uninstall_hook`) removing options, tables,
  transients and cron events.
- Third-party libraries with GPL-compatible licence and annotated version;
  nothing minified without source in the package or indicated in readme.
- Package without development files: `tests/`, `node_modules/`, source maps,
  uncompiled Vue sources, dev `vendor/`.
- No self-hosted updater or remote code loading.

## 4. Loop until zero

1. Run the tool; group by code and by file.
2. Treat one file at a time, starting with security (escape, SQL, nonce).
3. Run again. Repeat. Zero errors is mandatory; zero warnings is the goal,
   and each remaining warning carries the reason on the line.
