---
name: background-processes
description: Use when working with Tainacan importers, exporters, bulk edit, or background processing. Triggers on "importer", "exporter", "import", "export", "bulk edit", "background process", "bg-process", "heartbeat", "cron", "waiting", "processing", "CSV import", "OAI-PMH harvest", "loopback", "async", "queue".
---

# Tainacan background processes

## Architecture

Tainacan runs long operations (imports, exports, bulk edits) as background
processes. The system is built on top of WordPress's HTTP-based async request
pattern:

```
User triggers import
  → REST endpoint creates a background process entity
  → Process dispatches itself via an HTTP loopback request
  → Each iteration processes a batch, then re-dispatches
  → Heartbeat monitors and restarts stalled processes
```

### Key classes

| Class | Location | Role |
|---|---|---|
| `Background_Process_Base` | `classes/background-process/` | Base class for all async processes |
| `Background_Process` | `classes/background-process/` | Queue-based process manager |
| `Background_Process_Heartbeat` | `classes/background-process/` | Monitors and restarts stalled processes |
| `Async_Request` | `classes/background-process/` | HTTP loopback dispatch |

## Importers

Built-in importers in `classes/background-process/importer/`:

| Importer | Class | Imports from |
|---|---|---|
| CSV | `CSV` | CSV files with metadata columns |
| OAI-PMH | `Oaipmh_Importer` | OAI-PMH repositories (harvesting) |
| Flickr | `Flickr_Importer` | Flickr albums |
| YouTube | `Youtube_Importer` | YouTube playlists |
| Term Importer | `Term_Importer` | Term lists into taxonomies |
| Test Importer | `Test_Importer` | Random data for testing |

### Creating a custom importer

Extend `Tainacan\Importer\Importer`:

```php
namespace Tainacan\Importer;

class My_Importer extends Importer {
    public function __construct($attributes = []) {
        parent::__construct($attributes);
        $this->set_steps([
            ['name' => 'Process items', 'callback' => 'process_items'],
        ]);
    }

    public function process_items() {
        // Process a batch; return false when done
        // Return number of items processed, or false
    }

    public function get_source_metadata() {
        // Return array of source metadata names
    }
}
```

Register with the Importer_Handler.

## Exporters

Built-in exporters in `classes/background-process/exporter/`:

| Exporter | Class | Exports to |
|---|---|---|
| CSV | `CSV` | CSV file download |
| XLSX | `Xlsx_Exporter` | Excel spreadsheet |
| Term Exporter | `Term_Exporter` | Taxonomy term lists |

Exporters extend `Tainacan\Exporter\Exporter` with a similar step-based pattern.

## Bulk edit

`Generic_Process\Bulk_Edit_Process` applies operations (set value, replace,
clear, copy, add, remove) across multiple items in a collection. It uses the
generic process infrastructure.

## The loopback problem

Background processes dispatch themselves via an HTTP request to the site's own
URL. In containerised environments, `WP_SITE_URL` (e.g. `http://localhost:8080`)
points at a host-published port that the container **cannot reach**, so the
loopback fails silently and processes stay in `waiting`.

**Fix:** Set the `TAINACAN_BG_PROCESS_LOOPBACK_URL` constant to an internally
reachable URL (e.g. `http://nginx` in a Docker stack):

```php
define('TAINACAN_BG_PROCESS_LOOPBACK_URL', 'http://nginx');
```

## Heartbeat and watchdog

The heartbeat process runs periodically to:
- Detect stalled processes (no progress for a configured interval)
- Restart them by re-dispatching the loopback request

**Timestamps are UTC.** The heartbeat compares `last_progress` against
`time()` (UTC). If the WordPress timezone is not UTC, the gap calculation can
be wrong. The fix applied in the plugin normalises comparison to UTC.

## WP-Cron

Background process scheduling relies on WP-Cron, which is request-driven in
WordPress (fires on page loads). In a development environment with no traffic,
cron events accumulate. Run them manually:

```sh
make cron    # or: wp cron event run --due-now
```

## REST endpoints

| Endpoint | Methods | Purpose |
|---|---|---|
| `/bg-processes` | GET | List running/completed processes |
| `/bg-processes/{id}` | GET, PATCH, DELETE | Status, cancel, delete |
| `/importers` | GET, POST | List types, create session |
| `/importers/{session}` | GET, PATCH, DELETE | Configure, run, cancel |
| `/exporters` | GET, POST | List types, create session |
| `/exporters/{session}` | GET, PATCH, DELETE | Configure, run, cancel |
| `/collection/{id}/bulk-edit` | POST | Start bulk edit |

## Pitfalls

- Processes stuck in `waiting` almost always mean the loopback URL is unreachable
  from inside the container.
- The source file for CSV import must be accessible from the WordPress container
  (uploaded via the REST API or placed in an accessible path).
- Large imports should set appropriate `memory_limit` and `max_execution_time`
  in PHP configuration.
- Importer steps must be idempotent — a restart replays the current batch.
- Always test importers with the Test Importer first to verify the pipeline works.
