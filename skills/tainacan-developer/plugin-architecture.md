
# Tainacan plugin architecture

## Plugin vs development workspace

The repository root is the **development workspace** (build scripts, Composer,
npm, tests). The plugin WordPress loads is `src/`:

```
<repo>/
    src/                 the actual WordPress plugin
        tainacan.php     plugin entry point and version header
        migrations.php   schema/data migrations, run on `init`
        classes/         PHP classes (autoloaded)
        views/           Vue admin app, Gutenberg blocks, SCSS sources
        assets/js/       webpack output (build artifact)
        assets/css/      sass output (build artifact)
        vendor/          composer output (build artifact)
    tests/               PHPUnit suite
    build.sh             orchestrates npm, composer, sass, webpack
```

Key constants defined in `src/tainacan.php`:

| Constant | Purpose |
|---|---|
| `TAINACAN_VERSION` | Current plugin version string |
| `TAINACAN_BASE_DIR` | Absolute path to `src/` |
| `TAINACAN_CLASSES_DIR` | Path to `src/classes/` |
| `TAINACAN_API_MAX_ITEMS_PER_PAGE` | REST pagination cap |
| `TAINACAN_API_MAX_BATCH_TERMS` | Bulk term operation limit (default 200) |

## The autoloader

`src/classes/tainacan-creator.php` registers `tainacan_autoload`. It is **not
PSR-4**. For a class in the `Tainacan` namespace it looks for:

```
class-tainacan-<lowercase-name-with-dashes>.php
```

in the directories listed in the `DIRS` array. So `Tainacan\My_Thing` loads from
a file named `class-tainacan-my-thing.php` in any registered directory.

**Registered directories** (from `DIRS`): `cli/`, `api/`, `oaipmh/`, `traits/`,
`classes/`, `mappers/`, `background-process/` (and its subdirectories for
entities, importer, exporter, generic-process), `exposers/`, `api/endpoints/`,
`repositories/`.

Deeper namespaces map to subdirectories:
- `Tainacan\Importer\X` → `background-process/importer/`
- `Tainacan\Exposers\Json` → `exposers/`

**Consequences:**

- Filename must exactly match the class name (underscores → dashes).
- A class in a directory not in `DIRS` will silently never load.
- Adding a new top-level directory requires adding it to `DIRS`.
- `error_log('Tainacan: Class X not found')` at runtime means autoloader mismatch.

## Namespaces

| Namespace | Directory | Responsibility |
|---|---|---|
| `Tainacan\Entities` | `classes/entities/` | Domain models: Collection, Item, Metadatum, Item_Metadata_Entity, Taxonomy, Term, Filter, Metadata_Section, Log |
| `Tainacan\Repositories` | `classes/repositories/` | Data access and entity factories; singletons via `::get_instance()` |
| `Tainacan\API` | `classes/api/` | REST layer, namespace `tainacan/v2` |
| `Tainacan\Exposers` | `classes/exposers/` | Output formats: JSON, HTML, CSV, XML, TXT, OAI-PMH, JSON-LD |
| `Tainacan\Mappers` | `classes/mappers/` | Metadata standard mappings (Dublin Core, etc.) |
| `Tainacan\Background_Process` | `classes/background-process/` | Importers, exporters, generic jobs, heartbeat |
| `Tainacan\Integrations` | `classes/integrations/` | ElasticPress, WordPress AI |
| `Tainacan\OAIPMH` | `classes/oaipmh/` | OAI-PMH protocol |
| `Tainacan\CLI` | `classes/cli/` | WP-CLI `wp tainacan` commands |
| `Tainacan` (root) | `classes/` | Private_Files, Roles, Search_Engine, Bulk_Edit, utilities |

## The singleton pattern

Repositories and handlers use `Traits\Singleton_Instance`:

```php
$items = \Tainacan\Repositories\Items::get_instance();
```

Always use `::get_instance()`, never `new`. The trait ensures one instance per
request and provides the standard access pattern across the codebase.

## Database storage

Tainacan stores most entities as WordPress custom post types, with metadata in
post meta and custom tables for relationships (item metadata, logs). Schema
changes go through `src/migrations.php` (run on `init`), never ad-hoc `dbDelta`
calls, so existing installs upgrade safely.

## Adding a class

1. Choose the namespace from the table above.
2. Create `class-tainacan-<name>.php` in the matching directory.
3. Match the class name exactly: `My_Class` → `class-tainacan-my-class.php`.
4. Use the `Singleton_Instance` trait if the class manages shared state.
5. Register WordPress hooks in the constructor or a dedicated `init()` called
   from `tainacan-creator.php`.
6. If publicly reachable, add a REST controller (see the `rest-api` skill).

## Pitfalls

- Never edit files under `src/vendor/`, `src/assets/js/`, or `src/assets/css/`;
  they are build artifacts.
- In a containerised setup the plugin may be mounted read-only for the web tier.
  Do not design features that write into the plugin directory at runtime.
- The autoloader filename convention is strict: a typo in the filename silently
  prevents loading with no error beyond the runtime "Class not found" message.
