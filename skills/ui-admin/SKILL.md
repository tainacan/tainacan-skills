---
name: ui-admin
description: Use when creating or refactoring a plugin's interface in the Tainacan admin. Triggers on "admin screen", "field in item/collection/metadatum form", "assistant beside item", "drawer", "suggestion panel", "integrate with Tainacan SPA", or when refactoring a plugin that observes DOM or manipulates Tainacan inputs.
---

# UI admin integration

## Choosing the layer

| Request | Layer |
|---|---|
| Settings or own panel | `\Tainacan\Pages` + `Singleton_Instance`, submenu |
| Own screen that is an application (tree, editable grid, tabs) | Same page + Vue 3 `createApp` in its container |
| Extra field in item/collection/metadatum/taxonomy/term/filter form | `tainacan_register_admin_hook()` + persistence trio |
| Action beside item (suggest, validate, fill) | Drawer attached to `<body>`, reacts to `tainacan_navigation_path_updated` and `tainacan_item_edition_item_loaded` |
| Fill item metadatum from plugin | `PUT tainacan/v2/item/{id}/metadata/{mid}` + `TainacanReloadItemMetadataForm` |
| PHP data to JS | `wp_add_inline_script` with `wp_json_encode`, nonce `wp_rest`, `wp_set_script_translations` |

## Non-negotiable rules

- **Vue follows the core pattern, in the right place.** The Tainacan admin is
  Vue 3; a plugin's own screen uses Vue 3 mounted on its own page. **Inside the
  core SPA** (item form, admin hooks) do not mount Vue (`createApp`): extra
  components only via `tainacan-register-vuejs-component`, the rest is jQuery +
  `@wordpress/api-fetch` + `@wordpress/hooks`.
- **Never locate and mutate Buefy inputs** (`.val()`, `dispatchEvent('input')`
  on a Tainacan field): write via REST and request reload.
- **Never observe `document.body`** with `MutationObserver` to discover the
  route: use the `wp.hooks` hooks from the core.
- Admin hook callback **returns** string, no `<script>`; JS in a separately
  enqueued file that listens to `tainacan-<entity>-hook-reload`.
- Drawer, not modal: non-blocking overlay, indicator to reopen, event
  delegation on `document`, re-caching references, `escapeHtml` on all dynamic
  content, conditional enqueue by screen.
- CSS under the plugin's root class, with `:root` token block `--tainacan-*`
  with fallback.
- Own REST in `<slug>/v1`, validated `args`, real `permission_callback`, cache
  by prefixed transient.

## Admin hook persistence trio

For form fields added via `tainacan_register_admin_hook`:

1. **Save**: hook on `tainacan-insert-tainacan-<entity>`, check `can_edit()`,
   save with `update_post_meta`.
2. **Expose via REST**: filter `tainacan-api-response-<entity>-meta` to add the
   field value (check permission before exposing).
3. **Register**: `register_post_meta` with `show_in_rest` for the meta key.

Checkbox stores array (`['1']`); `save_data` checks `can_edit()`.

## Writing item metadata from a plugin

```php
$response = wp_remote_request(
    rest_url( "tainacan/v2/item/{$item_id}/metadata/{$meta_id}" ),
    [
        'method'  => 'PUT',
        'headers' => [ 'X-WP-Nonce' => wp_create_nonce( 'wp_rest' ) ],
        'body'    => wp_json_encode( [ 'values' => $value ] ),
    ]
);
```

After writing, dispatch `TainacanReloadItemMetadataForm` via
`wp.hooks.doAction` so the Vue form reloads without F5 (Tainacan >= 1.1.0).

## Workflow

1. **Diagnosis** (existing plugin): fill the conformity checklist and list gaps
   by priority. New plugin: `plugin-scaffold` skill first.
2. **Plan** with verifiable criteria: for each layer, the command or observation
   that proves it.
3. **Implement** layer by layer, preserving current behaviour.
4. **Verify** in the real SPA, with the theme in use and other plugins active.
