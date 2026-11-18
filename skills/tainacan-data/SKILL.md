---
name: tainacan-data
description: Data management at scale with Tainacan. Load when migrating collections, configuring Elasticsearch, tuning performance for large datasets, or working with importers/exporters. Triggers on "migrate collection", "CSV import", "legacy system", "Elasticsearch", "ElasticPress", "search engine", "performance", "large collection", "slow query", "fetch_only", "N+1", "facet counting", "importer", "exporter", "bulk edit", "background process".
---

# Tainacan data

Everything for managing data at scale: migrating collections, configuring
search, tuning performance, and running bulk operations.

## Collection migration workflow

1. **Inventory** — export and document the legacy collection.
2. **Metadata map** — map each legacy field to a Tainacan metadatum.
3. **CSV preparation** — one row per item, `||` for multi-value,
   `special_document` column for attachments.
4. **Import** — use the Tainacan CSV importer.
5. **Reconciliation** — compare counts, spot-check, verify no duplicate terms.

Pitfalls: silent normalisation creates duplicate terms,
`wp_set_object_terms()` with numeric strings creates new terms instead of
assigning by ID.

## Elasticsearch

Search engine abstraction: `Tainacan\Search_Engine`. Integration:
`Tainacan\Integrations\Elastic_Press`. Setup: `make up-elastic`, activate
ElasticPress, configure index, sync. ES 8.15 at `http://elasticsearch:9200`.

## Performance for large collections

**Measure before changing.** Key bottlenecks:

| Issue | Fix |
|---|---|
| Missing `fetch_only` | Always pass `fetch_only` + `fetch_only_meta` |
| Facet counting on large taxonomies | Limit visible facets, use ES |
| N+1 queries | Batch-fetch metadata with repository methods |
| `perpage=-1` | Always paginate |
| Unbounded term queries | Add `number` parameter |

## Background processes

Importers, exporters and bulk edit run as background processes. Heartbeat
monitors stuck processes. Loopback URL must be reachable from inside the
container (`http://nginx` in Docker). Run cron with `make cron`.

## Sub-skills

| File | Covers |
|---|---|
| [collection-migration.md](collection-migration.md) | Migrating from legacy systems: inventory, CSV, reconciliation |
| [elasticsearch.md](elasticsearch.md) | ElasticPress integration, indexing, faceted search |
| [performance.md](performance.md) | Large-collection bottlenecks, measurement, safe optimisation |
| [background-processes.md](background-processes.md) | Importers, exporters, bulk edit, heartbeat, cron |
