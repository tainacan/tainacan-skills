---
name: hooks-and-extensions
description: Use when extending Tainacan through WordPress hooks, adding custom metadata or filter types, or checking capabilities. Triggers on "hook", "action", "filter", "do_action", "apply_filters", "capability", "role", "tainacan_edit_items", "extend Tainacan", "custom metadata type", "custom filter type", "third-party integration", "plugin extension".
---

# Tainacan hooks and extensions

## Hook categories

Tainacan fires ~300 hooks across its codebase. They fall into these categories:

### Entity lifecycle hooks

Fired by repositories on create, update, and delete:

```php
// Before/after insert (create or update)
do_action('tainacan-insert', $entity);
do_action('tainacan-insert-{$post_type}', $entity);

// Before/after delete
do_action('tainacan-delete', $entity);
```

### Collection and item hooks

```php
// Item created/updated in a collection
do_action('tainacan-insert-tainacan-item', $item);

// Collection settings changed
do_action('tainacan-insert-tainacan-collection', $collection);
```

### Metadata hooks

```php
// Metadata value saved
do_action('tainacan-insert-Item_Metadata_Entity', $item_metadata);

// Metadata definition changed
apply_filters('tainacan-fetch-metadata', $metadata, $args);
```

### Search and query hooks

```php
// Modify item queries
apply_filters('tainacan-fetch-args', $args, $mapping);
apply_filters('tainacan_items_get_items_args', $args);

// Search engine selection
apply_filters('tainacan-search-engine', $engine);
```

### REST API hooks

```php
// Modify REST responses
apply_filters('tainacan-api-prepare-items', $response, $item, $request);
apply_filters('tainacan-api-items-prepare-for-response', $item_arr, $item, $request);
```

### Import/export hooks

```php
do_action('tainacan-importer-process-item', $item, $collection_definition);
do_action('tainacan-exporter-process-item', $item, $collection_definition);
```

## Capabilities and roles

`Tainacan\Roles` defines Tainacan-specific capabilities and maps them to
WordPress roles. The main capabilities:

| Capability | Grants |
|---|---|
| `tainacan_edit_items` | Create and edit items |
| `tainacan_delete_items` | Delete items |
| `tainacan_read_private_items` | View private/draft items |
| `tainacan_edit_collections` | Create and edit collections |
| `tainacan_delete_collections` | Delete collections |
| `tainacan_edit_metadata` | Manage metadata definitions |
| `tainacan_edit_filters` | Manage filter definitions |
| `tainacan_edit_taxonomies` | Manage taxonomies |
| `tainacan_manage_tainacan` | Full administration |

Enforce these in REST `permission_callback` methods, not just in the UI.

Collection-level capabilities also exist (e.g. `tainacan_edit_items` scoped to a
specific collection).

## Creating a custom metadata type

A metadata type has a PHP class and Vue components:

1. **PHP class** in `src/views/admin/components/metadata-types/<type-name>/`:

```php
namespace Tainacan\Metadata_Types;

class My_Type extends Metadata_Type {
    function __construct() {
        parent::__construct();
        $this->set_name(__('My Type'));
        $this->set_primitive_type('string');
        $this->set_component('tainacan-my-type');
    }

    public function validate(\Tainacan\Entities\Item_Metadata_Entity $item_metadata) {
        // Return true or an error message
        return true;
    }
}
```

2. **Vue components** in the same directory:
   - `TainacanMyType.vue` — the form input component
   - `class-tainacan-my-type.php` — PHP registration

3. Register in the metadata types directory (already in `DIRS`).

## Creating a custom filter type

Similar pattern under `src/views/admin/components/filter-types/<type-name>/`:

1. PHP class extending the base filter type.
2. Vue component for the filter UI.
3. Register in the filter types directory.

## Extension patterns

### Adding functionality via a WordPress plugin

```php
// Listen for Tainacan item creation
add_action('tainacan-insert-tainacan-item', function($item) {
    // Your logic here
}, 10, 1);

// Modify item queries
add_filter('tainacan_items_get_items_args', function($args) {
    // Modify $args
    return $args;
}, 10, 1);
```

### Adding REST endpoints

Create a controller in an external plugin that extends
`Tainacan\API\Rest_Controller` and registers routes on `rest_api_init`.

## Finding hooks

```sh
grep -rn 'do_action\|apply_filters' src/classes/ --include='*.php'
```

The plugin's `generate_docs.sh` can produce hook documentation via
`wp-documentor` (requires Composer dev dependencies).

## Extending Tainacan from a plugin

### Before you start

- Declare `Requires Plugins: tainacan` in the plugin header (WordPress 6.5+).
- Loading order: `tainacan-register-metadata-type`,
  `tainacan-register-filter-type` and `tainacan-register-vuejs-plugin` fire
  **while the Tainacan file is included**. Register the `add_action` at the
  top level of the plugin file, not inside `plugins_loaded`.
- Access repositories: `tainacan_items()`, `tainacan_metadata()`,
  `tainacan_collections()` etc., or `\Tainacan\Repositories\X::get_instance()`.
  Never `new`.

### Extension points

**Admin form hooks** (`tainacan-register-admin-hooks`):
```php
add_action( 'tainacan-register-admin-hooks', function () {
    tainacan_register_admin_hook( 'item', function () {
        ob_start();
        include __DIR__ . '/views/field.php';
        return (string) ob_get_clean();  // MUST return string
    }, 'end-left' );  // begin-left, begin-right, end-left, end-right
} );
add_action( 'tainacan-insert-tainacan-item', function ( $item ) { /* save */ } );
```

**Faceted search, before/after each item** (JS, `wp.hooks`):
```js
const badge = ( html, item ) => html + '<span class="my-plugin-badge"></span>';
wp.hooks.addFilter( 'tainacan_faceted_search_collection_item_after', 'my-plugin', badge );
wp.hooks.addFilter( 'tainacan_faceted_search_item_after', 'my-plugin', badge );
```

**Metadatum value on item page**: types with custom HTML apply
`tainacan-item-metadata-get-value-as-html--type-<type>`. The generic filter
`tainacan-item-metadata-get-value-as-html` only runs for numeric, selectbox
and core-title.

**Custom metadata type**: extend `\Tainacan\Metadata_Types\Metadata_Type`;
register in `add_action( 'tainacan-register-metadata-type', fn( $helper ) =>
$helper->register_metadata_type( $handle, $class, $script ) )`. Options in
`metadata_type_options` and index `_option_<key>`.

**Custom filter type**: extend `Filter_Type`;
`tainacan-register-filter-type` + `register_filter_type()`. Options in
`filter_type_options` (no `_option_` index).

**Background process**: `do_action( 'tainacan-register-generic_process' )` and
`Generic_Process_Handler::get_instance()->register_generic_process(...)`.

**Importer / exporter / exposer / mapper**: via `tainacan-register-importers`,
`-exporters`, `-exposers`, `-mappers` hooks.

**Entity save hooks**: `tainacan-pre-insert`, `tainacan-insert`
(`$obj, $diffs, $is_update`), `tainacan-insert-<post_type>`,
`tainacan-deleted`. Every `insert()` generates a log; in bulk,
`$repo->disable_logs()` and reactivate afterwards.

## Pitfalls

- Hook names are not always prefixed with `tainacan`; some use post type names
  like `tainacan-collection` or `tainacan-item`.
- Capability checks must happen in permission callbacks, not just conditionally
  in the callback body.
- Third-party code hooking into entity lifecycle must handle both create and
  update cases (both trigger `tainacan-insert`).
- The item list uses `:key="index"`: the element is reused between pages; do
  not store state in the DOM.
- Term anchors come with single quotes inside the filter and double quotes on
  the final page (`wp_kses` rewrites): match with regex that accepts both.
- `metadata_type_options` index `_option_<key>` is never cleaned: a removed key
  leaves the old `_option_` behind.
