# Semantic search

Tainacan's RAG pipeline: vector spaces, embedding providers, the indexing
pipeline, retrieval with visibility filtering, and hybrid ranking.

## Architecture overview

Tainacan owns its own embedding storage and retrieval. It does **not** register
as a WordPress AI embedding consumer, because that manager is text-only, stores
in its own schema, and offers no native vector index.

What Tainacan reuses from WordPress AI: the architecture design (queue, backfill,
hashing, backoff) and optional answer generation through existing connectors.

## Vector spaces

A vector space is: provider + model + modality + dimension. Everything is queried
within one space. Vectors from different models are not comparable, even at equal
dimension.

### Registry table

`{prefix}tainacan_vec_spaces` stores:

| Column | Purpose |
|---|---|
| `space_key` | e.g. `openai:text-embedding-3-small:1536:text` |
| `provider` | Embedding provider ID |
| `model` | Model identifier |
| `modality` | `text` or `image` |
| `dimensions` | Vector dimension (fixed after table creation) |
| `table_name` | Physical chunk table name |
| `is_active` | One active space per modality |
| `status` | `pending`, `ready`, `error` |

### Chunk tables

One physical table per space, created on demand:

```sql
CREATE TABLE {prefix}tainacan_vec_{slug} (
    id           bigint unsigned NOT NULL auto_increment,
    item_id      bigint unsigned NOT NULL,
    collection_id bigint unsigned NOT NULL,
    metadatum_id bigint unsigned NULL,
    source       varchar(16) NOT NULL,   -- title | metadata | document | image
    chunk_index  int unsigned NOT NULL default 0,
    content      mediumtext NOT NULL,
    content_hash char(40) NOT NULL,
    attachment_id bigint unsigned NULL,
    embedding    VECTOR(<dimensions>) NOT NULL,
    indexed_at   datetime NOT NULL,
    PRIMARY KEY (id),
    KEY item_source (item_id, source),
    KEY coll (collection_id),
    KEY content_hash (content_hash),
    VECTOR INDEX vec_idx (embedding)
) ENGINE=InnoDB;
```

Any dimension works. A 384-dimension local model and a 3072-dimension API model
coexist as separate tables. Per-space drop and rebuild: changing provider means
dropping one table, not migrating a shared one.

## Embedding providers

Interface: `Tainacan\Rag\Providers\Embedding_Provider`

```php
interface Embedding_Provider {
    public function get_id(): string;
    public function get_label(): string;
    public function supported_modalities(): array;   // ['text'], ['text','image']
    public function get_dimensions( string $model ): int;
    public function get_max_batch(): int;
    public function embed_text( array $texts, string $model ): array;
    public function embed_image( array $paths, string $model ): array;
}
```

The default provider is the **WordPress AI connector** — configure once in
Settings → Connectors. Direct vendor keys are available through:

```php
add_filter( 'tainacan_rag_register_embedding_providers', function ( $providers ) {
    $providers['openai'] = new \Tainacan\Rag\OpenAI_Provider();
    return $providers;
} );
```

If your WordPress AI build has no embeddings client, wire one via mu-plugin:

```php
add_filter( 'tainacan_rag_wordpress_ai_embed', function ( $embedder, $inputs, $model ) {
    return function ( $inputs, $model ) {
        return my_client()->embed( $inputs, $model );
    };
}, 10, 3 );
```

## Image strategies

Two approaches, both available:

| Strategy | How | Requires |
|---|---|---|
| Caption-then-embed | Vision model describes image → text embedding | Any text provider |
| Native image embeddings | Multimodal model produces image vectors | CLIP, Cohere multimodal, Voyage, Gemini |

They live in different spaces. Cross-modal search is only offered for spaces
whose provider declares a shared space.

## Indexing pipeline

| Concern | Approach |
|---|---|
| Change capture | Watch item save, metadata save, document change, term save; enqueue |
| Immediate removal | On unpublish, trash, password-protect or delete: remove vectors immediately |
| Worker | Time-boxed run with a lock, reschedules itself; uses Tainacan's `Generic_Process_Handler` |
| Backfill | Per-collection or site-wide, batch cursor persisted for resume |
| Idempotency | `content_hash` per chunk; identical text is never re-embedded |
| Failure handling | Per-provider pause on 429/402, exponential retry, circuit breaker |
| Orphan sweep | Removes vectors whose item no longer exists or no longer qualifies |

Known trap: background processes stay in `waiting` unless
`TAINACAN_BG_PROCESS_LOOPBACK_URL` is set. Run `make bg-loopback` in the Docker
stack.

## Retrieval

`Tainacan\Rag\Semantic_Search`, always scoped to one space:

1. Embed the query in the active space for the requested modality.
2. ANN query: `ORDER BY VEC_DISTANCE_COSINE(embedding, VEC_FromText(%s)) LIMIT %d`.
3. Re-fetch hits through the `Items` repository (`post__in`) so collection
   privacy, capabilities, status and `Private_Files` apply.

Step 3 is the security boundary, not an optimisation. A vector index has no
concept of capabilities; skipping it returns private items to users who cannot
open them.

## Hybrid ranking

Keyword + vector results merged by **reciprocal rank fusion**:

```
score(item) = 1/(k + keyword_rank) + 1/(k + vector_rank)
```

Agreement between lists wins. Ties break on lower ID for deterministic ordering.

Keyword search is the fallback: every vector-side failure degrades to keyword
results with a `degraded` reason. A search box that returns nothing because an
API key expired is worse than one returning keyword-only results.

The hybrid reorder is opt-in and page-local: it changes order, never page
membership. Pagination stays WordPress's. Non-Tainacan post types are never
reordered.

## Environment gate

`Tainacan\Rag\Environment_Check` returns a verdict:

| Verdict | Meaning |
|---|---|
| **Ready** | Full interface: MariaDB ≥ 11.7, VECTOR works, Abilities API present |
| **Degraded** | Phase 1 works, Phase 2 blocked (MySQL or old MariaDB) |
| **Unsupported** | Abilities API missing (WordPress < 7.1) |

Probes run once, cached with a short TTL. DDL probes only run for `manage_options`
users on explicit request, never on front-end page loads. Probe tables are
scratch and dropped immediately.

## Grounded answers

`tainacan/rag-answer` retrieves, builds a grounded prompt, and returns citations
plus an optional generated answer.

- Citations come from snippets that this caller could see (post-visibility filter).
- The prompt is returned with the answer so "why did it say that" is answerable.
- With no generator wired, the response is `answer: null`, `reason: no_generator`,
  citations intact.
- The generator arrives through `tainacan_rag_answer_generator` filter.

## Admin console

Tainacan admin page at **Tainacan → Other → Semantic search**
(`admin.php?page=tainacan_rag`):

- **Requirements** — environment verdict.
- **Spaces** — create, configure, switch active space.
- **Indexing** — queue depth, drain, requeue failed, recent failures.
- **Coverage** — per-collection indexed/total counts.
- **Search preview** — test queries with scored results.

Every button presses the callback its ability is registered with, so the human
and agent surfaces cannot drift.

## MariaDB notes

| Fact | Detail |
|---|---|
| `VECTOR` exists from 11.7 | Native ANN storage |
| `VEC_FromText('[1,0,0]')` required | Bare `'[1,0,0]'` raises `ERROR 1292` |
| Vector index not used on 11.8.9 | `EXPLAIN` reports full scan; storage and ranking correct |
| No shared unit between cosine and keyword | Hence RRF fusion, not score addition |
