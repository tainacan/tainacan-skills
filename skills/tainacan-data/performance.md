
# Performance

## 1. Measure before changing

- Choose a reproducible measurement: request time (`curl -w "%{time_total}"`),
  `X-Tainacan-Query-Time` from REST, number and time of queries (Query Monitor
  or `SAVEQUERIES` + `$wpdb->queries`), memory (`memory_get_peak_usage()`).
- Use the real collection or a copy of the same size. Testing with 50 items
  proves nothing.
- For slow SQL: `EXPLAIN` on the captured query.

## 2. Known Tainacan bottlenecks

- **REST listing without `fetch_only`**: each item renders all metadata. Use
  `fetch_only` + `fetch_only_meta`.
- **Facets with counting**: one `WP_Query` per facet value; disable with
  `tainacan_option_facets_enable_count_items` or
  `TAINACAN_FACETS_DISABLE_COUNT_ITEMS`, or respond via filter
  `tainacan-fetch-all-metadatum-values`.
- **Default text search**: `LIKE '%term%'` on `wp_postmeta` (no index). With
  large collections, use an external index (Elasticsearch/OpenSearch) and keep
  SQL fallback.
- **`meta_query` with `CAST`** (NUMERIC, DATE): nullifies index. `meta_query`
  with LIKE also problematic.
- **`perpage=-1` / `posts_per_page => -1`**: paginate in batches of 100-500 and
  use `'fields' => 'ids'` when IDs suffice.
- **N+1 queries inside loops**: load everything before in one query (`post__in`,
  `IN (...)`), and use `update_meta_cache()`.
- **CPT registration on every `init`**: the core fetches all collections and
  taxonomies per request; many collections makes every page load expensive.
- **Total count**: every listing pays `found_posts`. Where the total is not
  displayed, use `no_found_rows => true`.
- **Logs**: every `insert()` generates a log and diff. During import,
  `disable_logs()` and reactivate.
- **Cache invalidated per item**: during import or harvest, do not flush
  everything per item; invalidate per collection with debounce.

## 3. Change safely

- One optimisation at a time, measuring afterwards with the same command.
- Cache: key includes everything that changes the result (user/role, language,
  parameters); expiration; never cache errors for long.
- Long processes: in batches, resumable, with lock (transient) and time limit;
  never delete the global background process queue.
- External index: the index is derived; the source of truth is the database.
  Counts that do not match: compare source x database x index separately before
  blaming the index.

## 4. Report

Measurement before, measurement after (same command), what changed, possible
side effects (cache, consistency) and how to revert.
