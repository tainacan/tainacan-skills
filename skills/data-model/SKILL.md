---
name: data-model
description: Use when working with Tainacan's domain model — collections, items, metadata, taxonomies, filters, metadata sections or item metadata. Triggers on "collection", "item", "metadatum", "metadata", "taxonomy", "term", "filter", "metadata section", "Item_Metadata_Entity", "domain model", "fetch", "insert", "validate", "entity", "repository pattern".
---

# Tainacan data model

## Overview

Tainacan models a **digital repository** as a set of collections, each containing
items described by metadata and organised with taxonomies and filters.

```
Collection
  ├── Metadata (grouped into Metadata Sections)
  ├── Filters (backed by metadata)
  └── Items
        └── Item_Metadata_Entity (one value per metadatum per item)

Taxonomy
  └── Terms (hierarchical, shared across collections)
```

## Core entities

| Entity | PHP class | Storage | Purpose |
|---|---|---|---|
| Collection | `Entities\Collection` | Custom post type | Top-level container of items and metadata |
| Item | `Entities\Item` | Custom post type | A record in a collection |
| Metadatum | `Entities\Metadatum` | Custom post type | A metadata definition (name, type, options) |
| Metadata_Section | `Entities\Metadata_Section` | Custom post type | Groups related metadata for display |
| Item_Metadata_Entity | `Entities\Item_Metadata_Entity` | Post meta / custom table | The actual value of one metadatum for one item |
| Taxonomy | `Entities\Taxonomy` | Custom post type | Wraps a WordPress taxonomy with Tainacan semantics |
| Term | `Entities\Term` | WordPress term | A value in a taxonomy hierarchy |
| Filter | `Entities\Filter` | Custom post type | A faceted search control backed by a metadatum |
| Log | `Entities\Log` | Custom post type | Audit trail of changes |

## The repository + entity pattern

Every entity type has a matching repository that handles persistence and queries:

```php
$repo = \Tainacan\Repositories\Items::get_instance();

// Fetch
$item = $repo->fetch($id);

// Update
$item->set_title('New title');
if ($item->validate()) {
    $repo->insert($item);
}

// Query
$items = $repo->fetch([
    'posts_per_page' => 20,
    'meta_query' => [...]
], 'OBJECT');
```

Repositories extend `Repositories\Repository` and are singletons
(`::get_instance()`). They encapsulate:

- `fetch()` — retrieve one or query many
- `insert()` — create or update
- `delete()` — remove
- `where()` — fluent query builder

Entities extend `Entities\Entity` and provide typed getters/setters backed by
post meta or custom tables, plus `validate()` for input checking.

## Metadata types

Each metadatum has a **type** that defines its storage format and UI component:

| Type | Class | UI component |
|---|---|---|
| Text | `Metadata_Types\Text` | text input |
| Textarea | `Metadata_Types\Textarea` | textarea |
| Numeric | `Metadata_Types\Numeric` | number input |
| Date | `Metadata_Types\Date` | date picker |
| Selectbox | `Metadata_Types\Selectbox` | dropdown |
| Taxonomy | `Metadata_Types\Taxonomy` | taxonomy term picker |
| Relationship | `Metadata_Types\Relationship` | item picker |
| Compound | `Metadata_Types\Compound` | group of child metadata |
| URL | `Metadata_Types\URL` | URL input |
| GeoCoordinate | `Metadata_Types\GeoCoordinate` | map picker |
| User | `Metadata_Types\User` | WordPress user picker |

Type classes live in `src/views/admin/components/metadata-types/`. Each has a PHP
registration class and Vue components for form input, display and options.

## Filter types

Filters drive the faceted search UI. Each filter type provides a Vue component:

Filter types live in `src/views/admin/components/filter-types/` and are
registered in `TAINACAN_FILTER_TYPES_DIR`.

## Working with item metadata

```php
$item_metadata_repo = \Tainacan\Repositories\Item_Metadata::get_instance();
$metadata_repo = \Tainacan\Repositories\Metadata::get_instance();

// Get all metadata for an item
$metadata_list = $metadata_repo->fetch_by_collection($collection);

foreach ($metadata_list as $metadatum) {
    $item_metadata = new \Tainacan\Entities\Item_Metadata_Entity($item, $metadatum);
    $value = $item_metadata->get_value();
}

// Set a value
$item_metadata = new \Tainacan\Entities\Item_Metadata_Entity($item, $metadatum);
$item_metadata->set_value('new value');
if ($item_metadata->validate()) {
    $item_metadata_repo->insert($item_metadata);
}
```

## Taxonomies and terms

Taxonomies wrap WordPress taxonomies. A taxonomy can be shared across multiple
collections by assigning the same taxonomy to metadata in different collections.

```php
$tax_repo = \Tainacan\Repositories\Taxonomies::get_instance();
$term_repo = \Tainacan\Repositories\Terms::get_instance();

$taxonomy = $tax_repo->fetch($tax_id);
$terms = $term_repo->fetch(['taxonomy' => $taxonomy->get_db_identifier()], 'OBJECT');
```

## Key relationships

- A **collection** owns zero or more **metadata** (through `collection_id`).
- **Metadata** are grouped into **metadata sections** for display.
- An **item** belongs to exactly one collection.
- Each **Item_Metadata_Entity** links one item to one metadatum with a value.
- A **filter** references one metadatum and provides a UI for faceted search.
- A **taxonomy** can be used by metadata in multiple collections.

## Pitfalls

- `Item_Metadata_Entity` is not a post type — it stores values in post meta or a
  custom table. It is instantiated with both an item and a metadatum.
- Always call `validate()` before `insert()`. Validation checks required fields,
  types, and unique constraints.
- Repositories handle WordPress hooks internally (actions on insert, update,
  delete). Do not bypass the repository to write directly to the database.
- Compound metadata have child metadata; query them through the parent.
