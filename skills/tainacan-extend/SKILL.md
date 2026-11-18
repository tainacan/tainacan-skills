---
name: tainacan-extend
description: Building plugins, themes and integrations on top of Tainacan. Load when creating a new plugin, extending Tainacan with custom types, or integrating third-party services. Triggers on "new plugin", "extend Tainacan", "custom metadata type", "custom filter type", "plugin scaffold", "third-party integration", "plugin coexistence", "importer", "exporter", "background process", "Requires Plugins", "plugin extension".
---

# Tainacan extend

Everything for building plugins, themes and integrations that work with
Tainacan.

## Before you start

- Declare `Requires Plugins: tainacan` in the plugin header (WordPress 6.5+).
- Loading order: `tainacan-register-metadata-type`,
  `tainacan-register-filter-type` and `tainacan-register-vuejs-plugin` fire
  while Tainacan loads. Register the `add_action` at the top level, not inside
  `plugins_loaded`.
- Access repositories via `tainacan_items()`, `tainacan_collections()`, etc., or
  `\Tainacan\Repositories\X::get_instance()`. Never `new`.

## Key extension points

| Hook | Purpose |
|---|---|
| `tainacan-register-metadata-type` | Register custom metadata types |
| `tainacan-register-filter-type` | Register custom filter types |
| `tainacan-register-admin-hooks` | Inject UI into admin forms |
| `tainacan-register-generic_process` | Register background processes |
| `tainacan-register-importers` | Register custom importers |
| `tainacan-register-exporters` | Register custom exporters |
| `tainacan-register-exposers` | Register output format exposers |
| `tainacan-insert-{post_type}` | React to entity saves |

## Multi-plugin coexistence

- Prefix everything: PHP namespace, function names, CSS classes, JS globals.
- Enqueue scripts/styles conditionally (only on Tainacan admin pages).
- Avoid `!important` in CSS; use Tainacan's existing class hierarchy.
- The item list uses `:key="index"` — do not store state in the DOM.

## Detailed references

For hooks, capabilities and extension point signatures, see
[tainacan-developer/hooks-and-extensions.md](../tainacan-developer/hooks-and-extensions.md).

For background process registration and architecture, see
[tainacan-data/background-processes.md](../tainacan-data/background-processes.md).

## Sub-skills

| File | Covers |
|---|---|
| [plugin-scaffold.md](plugin-scaffold.md) | Creating new plugins: structure, skeleton, quality standards from day one |
| [plugin-coexistence.md](plugin-coexistence.md) | Multi-plugin compatibility: collisions, naming, CSS/JS scoping, joint review |
