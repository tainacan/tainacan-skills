---
name: vue-admin
description: Use when working on the Tainacan admin interface, Vue components, metadata type or filter type UI, Gutenberg blocks, or the theme-side components. Triggers on "Vue", "admin app", "component", "metadata type component", "filter type component", "Gutenberg block", "tainacan block", "tainacan-form-item", "admin page", "search", "edition", "modal", "SCSS", "front-end", "theme helper".
---

# Tainacan Vue admin

## Overview

Tainacan's admin interface is a Vue 3 single-page application embedded in
WordPress admin. It manages collections, items, metadata, filters, taxonomies,
and import/export workflows.

## Directory structure

```
src/views/
    admin/
        admin.vue                    root admin SPA
        components/
            edition/                 item and collection editors
            filter-types/            filter type Vue components
            lists/                   list views (items, collections)
            metadata-types/          metadata type Vue components
            modals/                  dialog components
            navigation/              sidebar and breadcrumbs
            other/                   miscellaneous UI components
            reports/                 analytics and reports
            search/                  search and faceted browsing
        pages/                       route-level page components
        js/                          admin entry points, router, store
        scss/                        admin stylesheets
    gutenberg/
        blocks/                      Gutenberg block implementations
        js/                          block entry points
    theme-search/                    theme-side search components
```

## Metadata type components

Each metadata type has its own directory under
`src/views/admin/components/metadata-types/`:

```
metadata-types/
    text/
        TainacanText.vue             form input component
        class-tainacan-text.php      PHP registration
    numeric/
    date/
    taxonomy/
    relationship/
    compound/
    ... (one directory per type)
```

A metadata type component receives the `item_metadata_entity` as a prop and
emits value changes. The form wrapper `tainacan-form-item.vue` handles labels,
help text, and validation display.

### Creating a new metadata type component

1. Create a directory under `metadata-types/<name>/`.
2. Write the Vue component (`Tainacan<Name>.vue`) that:
   - Accepts `itemMetadatum` prop
   - Emits `input` / `update:modelValue` on changes
   - Handles display, editing, and optionally a "view" mode
3. Write the PHP class (see `hooks-and-extensions` skill).
4. Register the component in the webpack entry if needed.

## Filter type components

Similar structure under `filter-types/`:

```
filter-types/
    checkbox/
    selectbox/
    date-interval/
    numeric-interval/
    autocomplete/
    ...
```

Filter components interact with the faceted search system, receiving available
values and emitting selected filters.

## Gutenberg blocks

Tainacan provides several Gutenberg blocks for embedding repository content in
WordPress posts and pages:

- Item gallery
- Items list
- Collections list
- Faceted search
- Carousel
- Dynamic items list

Block source is in `src/views/gutenberg/blocks/`. Each block has:
- A `block.json` manifest
- A Vue or React component for the editor
- Server-side rendering via PHP

## Admin SPA routing

The admin app uses Vue Router with hash-based navigation:
`/wp-admin/admin.php?page=tainacan_admin#/collections`

Key routes:
- `#/collections` — collection list
- `#/collections/:id` — collection detail (items, metadata, filters)
- `#/collections/:id/items/:itemId/edit` — item editor
- `#/taxonomies` — taxonomy management
- `#/importers` — import workflows
- `#/exporters` — export workflows
- `#/activities` — activity log

## State management

The admin uses Vuex (or Pinia in newer versions) for state management, with
modules for collections, items, metadata, filters, search, etc.

## Styling

SCSS files live in `src/views/admin/scss/`. The build compiles them via
`compile-sass.sh` (see the `build-pipeline` skill). Component-scoped styles use
`<style scoped>` in Vue SFCs.

Tainacan uses [Buefy](https://buefy.org/) (Bulma-based) components for the UI
framework.

## Theme-side components

`src/views/theme-search/` contains Vue components used on the public-facing
theme for item browsing and faceted search. These are loaded via
`wp_enqueue_script` on pages with Tainacan content.

## Pitfalls

- Vue SFC imports require the `.vue` extension in import paths.
- Metadata type and filter type directories must be registered in the
  autoloader's `DIRS` array for PHP class loading.
- Gutenberg block changes require both the JS build and PHP registration.
- Admin SCSS changes need `compile-sass.sh` to include the entry file explicitly.
- The admin SPA loads only inside `admin.php?page=tainacan_admin`; do not expect
  Vue components to be available on arbitrary WordPress admin pages.
