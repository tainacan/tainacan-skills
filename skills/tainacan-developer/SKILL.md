---
name: tainacan-developer
description: Core Tainacan plugin development. Load when writing PHP, working with the REST API, data model, entities, repositories, testing, or the build pipeline. Triggers on "develop Tainacan", "write PHP", "add endpoint", "create entity", "write test", "plugin architecture", "autoloader", "repository pattern", "metadata type", "REST API", "tainacan/v2", "PHPUnit", "webpack", "composer", "build.sh".
---

# Tainacan developer

Everything for writing, testing and building code in the Tainacan core plugin.

## Autoloader and file conventions

Tainacan uses a **non-PSR-4** autoloader (`src/classes/tainacan-creator.php`).
For `Tainacan\Some_Class` it expects `class-tainacan-some-class.php` in one of
the directories listed in `DIRS`. Filename must match the class name exactly.

If you see `Tainacan: Class X not found`, it is a filename or directory problem.

## Core namespaces

| Namespace | Directory | Responsibility |
|---|---|---|
| `Tainacan\Entities` | `classes/entities/` | Models: Collection, Item, Metadatum, Item_Metadata_Entity, Taxonomy, Term, Filter, Metadata_Section, Log |
| `Tainacan\Repositories` | `classes/repositories/` | Persistence and queries; singletons via `::get_instance()` |
| `Tainacan\API` | `classes/api/` | REST controllers |
| `Tainacan\Metadata_Types` | `views/admin/components/metadata-types/` | PHP + Vue for each type |
| `Tainacan\Filter_Types` | `views/admin/components/filter-types/` | PHP + Vue for each type |
| `Tainacan\Background_Process` | `classes/background-process/` | Importers, exporters, bulk edit |
| `Tainacan\Integrations` | `classes/integrations/` | ElasticPress, WordPress AI |
| `Tainacan\CLI` | `classes/cli/` | WP-CLI commands |

## Repository + entity pattern

```php
$items = \Tainacan\Repositories\Items::get_instance();
$item  = $items->fetch($id);
$item->set_title('New title');
if ($item->validate()) {
    $items->insert($item);
}
```

Always `::get_instance()`; never `new`. Repositories use `Traits\Singleton_Instance`.

## REST API

Namespace `tainacan/v2`. Controllers in `src/classes/api/endpoints/`, extending
`Tainacan\API\Rest_Controller`. Every route needs an explicit
`permission_callback`. Use `fetch_only` + `fetch_only_meta` in listings.

Key query parameters: `perpage`, `paged`, `fetch_only`, `fetch_only_meta`,
`taxquery`, `metaquery`, `orderby`, `search`.

## Testing

PHPUnit with `TAINACAN_UnitTestCase` and `TAINACAN_UnitApiTestCase` base
classes. Files must be named `test-*.php` (not `_test-*` or `__test-*`).
Factories in `tests/factories/`. Run with `make test`.

## Build pipeline

`build.sh` runs npm ci, composer install, compile-sass.sh and webpack, gated by
checksums. Outputs: `src/vendor/`, `src/assets/js/*.js`, `src/assets/css/*.css`.

## Sub-skills

| File | Covers |
|---|---|
| [plugin-architecture.md](plugin-architecture.md) | Autoloader, namespaces, entities, repositories, singleton pattern, file conventions |
| [data-model.md](data-model.md) | Collections, items, metadata, taxonomies, filters, metadata sections, item metadata |
| [rest-api.md](rest-api.md) | Endpoints, controllers, permissions, querying, consuming the API, exposers, mappers, OAI-PMH |
| [hooks-and-extensions.md](hooks-and-extensions.md) | WordPress hooks, extension points, admin form hooks, faceted search hooks, capabilities, roles |
| [testing.md](testing.md) | PHPUnit wiring, factories, REST tests, writing and running tests |
| [build-pipeline.md](build-pipeline.md) | npm, webpack, sass, composer, asset enqueueing, `build.sh` |
| [dev-environment.md](dev-environment.md) | Docker stack (tainacan-docker), services, mounts, make targets, troubleshooting |
