---
name: tainacan-designer
description: Tainacan UI and theme development. Load when working on the Vue admin, theme templates, metadata/filter type components, or frontend assets. Triggers on "Vue component", "admin page", "theme template", "Theme Helper", "Gutenberg block", "SCSS", "Sass", "tainacan-items-list", "view mode", "Customizer", "faceted search UI", "metadata type component", "filter type component", "admin UI", "drawer".
---

# Tainacan designer

Everything for working on the Tainacan frontend: the Vue 3 admin SPA, theme
integration, metadata/filter type components, and assets.

## Vue 3 admin SPA

The admin lives under `src/views/admin/` as a Vue 3 SPA:

| Directory | Contents |
|---|---|
| `src/views/admin/components/` | Reusable Vue components |
| `src/views/admin/pages/` | Route-level page components |
| `src/views/admin/components/metadata-types/` | One directory per metadata type (PHP class + Vue component) |
| `src/views/admin/components/filter-types/` | One directory per filter type (PHP class + Vue component) |

State management uses a Vuex-like store with modules per domain.

## Admin page hooks

```php
add_action('tainacan-register-admin-hooks', function () {
    tainacan_register_admin_hook('item', function () {
        ob_start();
        include __DIR__ . '/views/field.php';
        return (string) ob_get_clean();  // MUST return string
    }, 'end-left');  // begin-left, begin-right, end-left, end-right
});
```

The persistence trio: register the hook, save via `tainacan-insert-{post_type}`,
read via `get_post_meta()`. The drawer pattern uses `tainacan_register_admin_hook`
with `drawer-left` / `drawer-right` positions.

## Theme development

Themes use **Theme Helper** (`Tainacan\Theme_Helper`) which registers template
hierarchy, the `[tainacan-items-list]` shortcode / Gutenberg block, and view
modes (grid, table, cards, masonry, records, map, slideshow).

Non-negotiable rules:
- Escape every output (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`)
- No CDN — enqueue from local copies
- Use `MutationObserver` for Tainacan's Vue-mounted DOM, not timers

## Build pipeline

Webpack entries in `webpack.common.js`, Sass entries in `compile-sass.sh`.
Run `make assets` to build, `make watch` for live rebuilds.

For the full build pipeline reference, see
[tainacan-developer/build-pipeline.md](../tainacan-developer/build-pipeline.md).

## Sub-skills

| File | Covers |
|---|---|
| [vue-admin.md](vue-admin.md) | Vue 3 admin app, component architecture, metadata types, filter types, Gutenberg blocks |
| [ui-admin.md](ui-admin.md) | Pages API, form hooks, drawer pattern, REST metadata writes |
| [theme-development.md](theme-development.md) | Theme Helper, templates, view modes, Customizer, Sass |
