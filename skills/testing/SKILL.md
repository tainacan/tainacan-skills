---
name: testing
description: Use when running, writing or debugging Tainacan PHPUnit tests. Triggers on "phpunit", "unit test", "test case", "bootstrap-config", "WP_TESTS_DIR", "install-wp-tests", "factory", "tests/", "WP_UnitTestCase", "REST test", "test database", "TAINACAN_UnitTestCase".
---

# Tainacan testing

## Test suite wiring

- `phpunit.xml.dist` sets `bootstrap="tests/bootstrap.php"` and collects files
  matching `./tests/test-*.php`.
- `tests/bootstrap.php`:
  1. Requires `tests/bootstrap-config.php` (gitignored; sample provided).
  2. Resolves `WP_TESTS_DIR` from the environment (falls back to config).
  3. Registers `_manually_load_plugin()` on `muplugins_loaded`, which requires
     `src/tainacan.php` and fires the activation hook.
  4. Requires `src/vendor/autoload.php` and the WordPress test bootstrap.
  5. Loads the Tainacan factories and base test cases.

Base test cases (namespace `Tainacan\Tests`):

| Class | Use when |
|---|---|
| `TAINACAN_UnitTestCase` | General entity and repository tests |
| `TAINACAN_UnitApiTestCase` | REST endpoint tests (boots `WP_REST_Server`, fires `rest_api_init`) |

Factories in `tests/factories/` create entities, metadata, filters, and item
metadata for test setup.

## Prerequisites

- Composer dev dependencies installed (`src/vendor/bin/phpunit`).
- A `tests/bootstrap-config.php` file (created from sample on first run).
- The WordPress test library installed at `WP_TESTS_DIR`.

## Running tests

In a docker stack:

```sh
make test          # installs WP test suite if needed, runs phpunit
```

This executes inside the builder image:

```sh
tests/bin/install-wp-tests.sh tainacan_test root <db_root_password> /tmp/wp-tests db:3306 latest
src/vendor/bin/phpunit
```

The installer creates `/tmp/wp-tests/wordpress-tests-lib` and
`/tmp/wp-tests/wordpress-test`. `WP_TESTS_DIR` must point at
`.../wordpress-tests-lib` (not the parent).

Single file or filter:

```sh
docker compose --profile watch run --rm --no-deps \
  -e WP_TESTS_DIR=/tmp/wp-tests/wordpress-tests-lib \
  builder sh -lc 'src/vendor/bin/phpunit tests/test-api-items.php'
```

## Writing a test

```php
<?php
namespace Tainacan\Tests;

class Test_My_Feature extends TAINACAN_UnitTestCase {

    public function setUp(): void {
        parent::setUp();
        // Setup code
    }

    public function test_something_works() {
        $collection = $this->tainacan_entity_factory->create_entity(
            'collection', ['name' => 'Test'], true
        );
        $this->assertNotEmpty($collection->get_id());
    }
}
```

For REST tests, extend `TAINACAN_UnitApiTestCase`:

```php
<?php
namespace Tainacan\Tests;

class Test_Api_My_Resource extends TAINACAN_UnitApiTestCase {

    public function test_get_items() {
        $request = new \WP_REST_Request('GET', $this->namespace . '/collections');
        $response = rest_do_request($request);
        $this->assertEquals(200, $response->get_status());
    }
}
```

Conventions:
- File: `test-<area>.php`
- Class: `Test_<Area>`
- Namespace: `Tainacan\Tests`
- Method: `public function test_<description>()`

## Naming gotcha

The PHPUnit config only collects `test-*.php`. Files named `__test-*.php` or
`_test-*.php` are intentionally **not** run. If your new test is ignored, check
the filename first.

## Coverage map

| Area | Test files |
|---|---|
| Entities & repos | `test-entities.php`, `test-collections.php`, `test-items.php`, `test-item-metadata.php`, `test-metadata.php`, `test-taxonomies.php`, `test-filters.php`, `test-facets.php` |
| REST endpoints | `test-api-*.php` (one per controller) |
| Metadata types | `test-*-metadatum-types.php`, `test-api-filter-types.php` |
| Import/export | `test-importer.php`, `test-exporters.php`, `test-exporter-mapping.php`, `test-api-importers.php` |
| Background | `test-bgprocess.php`, `test-bulkedit-bg-process.php`, `test-api-background-processes.php` |
| Cross-cutting | `test-capabilities.php`, `test-api-roles.php`, `test-html-injection.php`, `test-api-oaipmh.php`, `test-utilities.php` |

## Pitfalls

- `bootstrap-config.php` is required even when `WP_TESTS_DIR` is set via env.
- `WP_TESTS_DIR` must be `.../wordpress-tests-lib`, not the parent directory.
- Tests need `src/vendor` (Composer dev deps); build assets first.
- The test installer runs as `root` to create the `tainacan_test` database.
- Tests share the database container; a concurrent `make reset` can break a run.
- `phpunit tests/test-x.php` may fail with "Class not found" because PHPUnit
  derives the class from the filename; use `phpunit --filter <ClassName>` instead.
