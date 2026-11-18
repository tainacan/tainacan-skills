# Abilities API internals

How Tainacan registers abilities on the WordPress Abilities API and how the
REST bridge executes them without HTTP loopback.

## Registration contract

Two hooks, in this order, and nothing outside them:

```php
add_action( 'wp_abilities_api_categories_init', [ $this, 'register_categories' ] );
add_action( 'wp_abilities_api_init',            [ $this, 'register_abilities' ] );
```

Registering anywhere else returns `null` and fires `_doing_it_wrong`, which is
silent when `WP_DEBUG` is off. Categories must exist before abilities reference
them. Guard the whole bootstrap with
`if ( ! function_exists( 'wp_register_ability' ) ) { return; }`.

## Where the code lives

```
src/classes/abilities/
    class-tainacan-abilities-bootstrap.php   two hooks, guard clause
    class-tainacan-abilities-categories.php  category registration
    class-tainacan-ability-bridge.php        REST request ↔ ability adapter
    class-tainacan-abilities-registry.php    declarative table, one row per ability
    class-tainacan-ability-collections.php   one class per resource group
    class-tainacan-ability-items.php
    class-tainacan-ability-media.php
    ...
```

Autoloader branch in `tainacan-creator.php`:

```php
const TAINACAN_ABILITIES_DIR = __DIR__ . '/abilities/';

} else if ( isset( $class_path[1] ) && $class_path[1] === 'Abilities' ) {
    $dir = TAINACAN_ABILITIES_DIR;
}
```

Not added to `DIRS` — the explicit branch runs first and avoids probing every
ability file for unrelated classes.

## Declarative ability table

`Abilities_Registry` holds one row per ability: name, label, description,
category, route, method, schema, annotations, required capability. The bridge
reads routes from `rest_get_server()->get_routes()` at runtime — the table
stores the route, never a transcription of its arguments.

Adding an ability is a one-row change for simple reads.

## REST bridge execution

`Ability_Bridge` does not use HTTP loopback (containers cannot reach the
published `WP_SITE_URL`). Instead it:

1. Resolves the route to a handler from `rest_get_server()->get_routes()`.
2. Builds a `WP_REST_Request` from ability input (query, body, url params).
3. Calls the controller's `permission_callback` — returns `WP_Error` unchanged
   when it refuses.
4. Calls the controller callback.
5. Normalizes: `WP_REST_Response` → `get_data()`, escalating status ≥ 400 to
   `WP_Error`; passes `WP_Error` through; anything else as-is.

A permission refusal never reaches the controller callback.

## Schema design

Declare only the parameters that matter in `input_schema` (`collection_id`,
`id`, `per_page`, `search`, `metaquery`, `orderby`, `status`), leave
`additionalProperties` open, and let the controller validate the rest.

An over-tight schema rejects legitimate Tainacan query arguments and is worse
than a loose one. Use object schemas; reserve flattened schemas for single-value
abilities.

Schemas must allow `null` input — a client that omits input sends `null`, and a
strict object schema rejects it before the callback runs, making every
zero-argument ability uncallable.

## MCP tool name mapping

MCP rewrites `/` to `-`, so `tainacan/collection-create` becomes
`tainacan-collection-create` for clients. Choose names with that in mind.

## Annotations

```php
'meta' => [
    'public'      => true,
    'mcp'         => [ 'type' => 'tool' ],
    'annotations' => [
        'readonly'    => true,      // readOnlyHint
        'destructive' => false,     // destructiveHint
        'idempotent'  => true,      // idempotentHint
    ],
],
```

Annotations use the WordPress spelling (`readonly`, `destructive`, `idempotent`)
and the MCP adapter converts them to `readOnlyHint`, `destructiveHint`,
`idempotentHint`.

Mark `delete`, `bulk-edit-apply`, `import-run` and `item-set-document` as
`destructive: true`.

## Capabilities REST endpoint

The abilities are available at:

- `GET /wp-abilities/v1/abilities` — list all abilities
- `GET /wp-abilities/v1/abilities/{name}` — get one ability
- `POST /wp-abilities/v1/abilities/{name}/run` — execute an ability
- `GET /wp-abilities/v1/categories` — list categories

The run endpoint reads the raw JSON body, not form parameters. Input must be
`{"input": {...}}` as JSON.

## Verified numbers

| Metric | Value |
|---|---|
| Total abilities | 58 (3 core + 55 Tainacan) |
| Test suite | 446 tests, 4920 assertions |
| Ability-specific tests | 45 tests, 755 assertions |
| REST surface mapped | 137 operations across 22 controllers |
