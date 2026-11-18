# Agent workflows

End-to-end playbooks for agents working with Tainacan. Each has a preflight,
ordered steps, verification, and what to do when something fails.

## Playbook 1: bootstrap a collection from a specification

Build a collection schema first, content second.

### Preflight

- Abilities API available: `GET /wp-abilities/v1/abilities` returns Tainacan abilities.
- Agent user has `tainacan_edit_collections`, `tainacan_edit_metadata`, `upload_files`.
- Specification defines: collection name, metadata sections, metadata (name, type,
  required, multiple, description), taxonomies with terms, filters.

### Steps

1. **Create taxonomies first** — `tainacan/taxonomy-create` for each controlled
   vocabulary. Taxonomies must exist before metadata of type `taxonomy` reference them.
2. **Create terms** — `tainacan/taxonomy-bulk-terms` for efficiency, or
   `tainacan/term-create` for small sets.
3. **Scaffold the collection** — `tainacan/collection-scaffold` with the full schema:
   collection settings, metadata sections, and metadata definitions in one call.
   Alternatively, create step by step: `collection-create`, then `metadata-section-create`
   for each section, then `metadata-create` for each metadatum.
4. **Create filters** — `tainacan/filter-create` for each filterable metadatum.
5. **Verify** — `tainacan/metadata-list` and `tainacan/filter-list` to confirm counts
   match the specification.

### Failure modes

| Symptom | Cause |
|---|---|
| Metadata creation returns error | Metadatum type not registered; check `tainacan/metadata-types-list` |
| Taxonomy metadatum fails | Taxonomy not created yet; create taxonomies before metadata |
| Scaffold partial success | Some metadata created, others failed; check each error and retry the failed ones |

---

## Playbook 2: load a folder of documents plus a metadata CSV

The flagship ingest workflow.

### Preflight

- Collection exists with metadata matching CSV columns.
- Files are accessible to the agent (local path or URLs).
- CSV has headers matching metadatum names, one row per item.

### Steps

1. **Upload files** — `tainacan/attachment-upload` per file. Collect the returned
   attachment IDs. For URLs, pass the URL directly.
2. **Create items with metadata** — For each CSV row:
   - `tainacan/item-create-with-metadata` with the row's values and the attachment ID
     as the document.
   - Or use `tainacan/batch-items-create` for bulk creation (chunked internally).
3. **Publish** — `tainacan/item-publish` for each item, or use `tainacan/bulk-edit-apply`
   with operation `set_status` and value `publish` for all items at once.
4. **Verify counts** — `tainacan/item-list` with `per_page=1` to get `X-WP-Total` header.
   Compare with CSV row count.
5. **Spot-check** — `tainacan/item-get` on a sample of items. Confirm metadata values,
   document attachment, and status.

### Failure modes

| Symptom | Cause |
|---|---|
| `attachment-upload` fails | File too large, type not allowed, or `upload_files` capability missing |
| Item created but no document | Attachment ID not passed, or `item-set-document` not called |
| Metadata values empty | Column name doesn't match metadatum name exactly |
| Items stuck as draft | `item-publish` not called; for bulk, check `bulk-edit-apply` status |

---

## Playbook 3: retrofit metadata onto an existing collection

Add metadata to items that already exist without losing data.

### Steps

1. **Audit** — `tainacan/metadata-list` to see existing metadata. `tainacan/item-list`
   to get total items.
2. **Add metadata definitions** — `tainacan/metadata-create` for each new metadatum.
   Set `metadata_section_id` to place it correctly. Set ordering with `metadata_order`.
3. **Backfill values** — For each item, `tainacan/item-metadata-set` with the new values.
   Use pagination: `item-list` with `per_page=20`, `page=1,2,3...`.
4. **Verify** — Spot-check that old metadata values are unchanged. Confirm new values
   are set on a sample.

### Key constraint

Never delete existing metadata to replace them. The values are lost. Add new
metadata alongside, backfill, verify, then optionally hide the old ones.

---

## Playbook 4: enable semantic search and validate quality

### Preflight

- Collection has published items with text content.
- MariaDB ≥ 11.7 with `VECTOR` support.
- WordPress AI plugin active with an authenticated connector, or a direct
  embedding provider registered.

### Steps

1. **Check environment** — `tainacan/rag-status`. Verify verdict is `ready`.
2. **Configure a space** — `tainacan/rag-configure` with connector, model, and dimension.
   The dimension is fixed after creation — changing it requires dropping and rebuilding.
3. **Index a sample** — `tainacan/rag-index-collection` for one collection. Poll
   `tainacan/rag-status` for queue depth to reach zero.
4. **Test queries** — `tainacan/rag-search` with known phrases from item titles or
   content. Verify the right items appear in results.
5. **Check visibility** — Unpublish one item, search again. It must not appear in
   results. This is the security boundary working.
6. **Index everything** — Repeat step 3 for remaining collections.

### Failure modes

| Symptom | Cause |
|---|---|
| `rag-status` returns `unsupported` | Abilities API missing; WordPress < 7.1 |
| `rag-status` returns `degraded` | MariaDB missing or < 11.7; MySQL instead of MariaDB |
| Indexing queue stuck at pending | Background process loopback broken; run `make bg-loopback` |
| `tainacan_rag_provider_paused` | Circuit breaker tripped; clear from admin console |
| `tainacan_rag_provider_not_configured` | Connector not authenticated in Settings → Connectors |
| Search returns no results | Items not indexed yet, or query has no semantic match |

---

## Playbook 5: bulk publish or unpublish with an audit trail

### Steps

1. **List items** — `tainacan/item-list` with `status=draft` (or `publish`) and
   the target collection.
2. **Apply bulk edit** — `tainacan/bulk-edit-apply` with operation `set_status`,
   value `publish` (or `draft`), and the item IDs.
3. **Verify** — `tainacan/item-list` again. Compare counts.
4. **Read logs** — Use `tainacan/rest-request` to `GET /tainacan/v2/logs` and confirm
   the status changes were recorded with the agent user.

---

## Playbook 6: change embedding provider

Changing model or dimension requires rebuilding the vector space.

### Steps

1. **Record current state** — `tainacan/rag-status` to note current space, dimensions,
   chunk counts.
2. **Delete the old space** — `tainacan/rag-configure` to remove it. Vectors are dropped
   with the table.
3. **Create new space** — `tainacan/rag-configure` with the new connector, model, and
   dimension.
4. **Re-index all collections** — `tainacan/rag-index-collection` for each.
5. **Verify** — Run the same test queries from playbook 4.

Vectors from different models are **not comparable**, even at equal dimension.
Never mix models in one space.

---

## Playbook 7: hand-off audit

A checklist an agent runs to certify a collection it built.

### Checks

1. **Schema matches specification** — `tainacan/metadata-list` returns the expected
   metadata count, names, and types.
2. **Item count matches source** — `tainacan/item-list` total equals the input row count.
3. **Attachments resolve** — Sample `tainacan/item-get` calls show document attachments
   with valid URLs.
4. **Index coverage** — `tainacan/rag-status` shows the collection at 100% coverage
   (if semantic search was configured).
5. **No private item leaked** — An unauthenticated `tainacan/rag-search` never returns
   a draft or private item.
6. **Filters work** — `tainacan/facet-get` returns expected facet values.
7. **Logs recorded** — Recent logs show the agent user's actions.

### What constitutes a pass

All 7 checks pass. If any fails, the agent reports which check failed and what
the expected vs actual values were. It does not silently mark the work as done.
