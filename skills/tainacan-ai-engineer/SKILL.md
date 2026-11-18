---
name: tainacan-ai-engineer
description: Building AI-powered agents and workflows with Tainacan's WordPress Abilities API. Load when connecting an agent to Tainacan over MCP or REST, building agent-driven collection workflows, configuring semantic search and RAG, or working with assisted authoring features. Triggers on "agent", "MCP", "abilities", "AI engineer", "connect agent", "agent workflow", "RAG", "semantic search", "vector space", "embeddings", "trust boundary", "assisted authoring", "alt-text generation", "suggest metadata", "application password", "agent role", "least privilege".
---

# Tainacan AI engineer

Everything an agent needs to work with Tainacan: connecting over MCP or REST,
driving collections through abilities, configuring semantic search, and
understanding what agents can and cannot do inside WordPress.

## The trust boundary

WordPress is a **deterministic capability server**. It never plans, never loops
over its own output, never chooses which action to take next. All agentic
behaviour happens in the client — the user's IDE agent, MCP client, or script.

Two surfaces exist and must not blur:

| Surface | What it is | Determinism |
|---|---|---|
| Capability | Registered abilities, permission-checked, auditable | Deterministic: same input, same effect |
| Inference | Single-shot assisted-authoring calls to an external provider | Non-deterministic, proposal only |

Rules enforced by design:

1. **No server-side tool-calling loop.** An ability callback makes at most one
   inference call and must return data.
2. **Inference output is a proposal, not a commit.** Assisted features populate
   form state; persisting requires a separate explicit action.
3. **Assisted features cannot write.** They depend on read paths and provider
   clients, never on repository `insert()`/`update()`.
4. **Untrusted text stays data.** Item titles, metadata values, filenames and
   OCR output go into a delimited data block, never into the instruction portion.
5. **Credentials never travel in artifacts.** Keys live in `wp_options`, are
   never returned by a route.

## Connecting an agent

Three connection modes, depending on the hosting environment:

| Mode | Requires | Best for |
|---|---|---|
| MCP over HTTP | MCP adapter plugin + application password | IDE agents, Claude Code |
| Direct REST | Application password | Scripts, custom clients |
| WP-CLI | Shell access | Verification, bulk work |

Authentication: create a **dedicated WordPress user** with a least-privilege
role. Never use an administrator account. Create an **application password** for
that user under Users → Edit → Application Passwords.

The recommended agent role needs these Tainacan capabilities:
`tainacan_edit_collections`, `tainacan_edit_items`, `tainacan_edit_metadata`,
`tainacan_edit_filters`, `tainacan_edit_taxonomies`, `tainacan_read_private_items`,
`upload_files`. It must **not** have `manage_options`, `manage_users`, or
`activate_plugins`.

## Abilities overview

Tainacan registers **55 abilities** alongside WordPress core's 3, in namespace
`tainacan/`. An MCP adapter rewrites `/` to `-`, so `tainacan/collection-create`
becomes `tainacan-collection-create` for clients.

### Categories

| Slug | Scope |
|---|---|
| `tainacan` | General |
| `tainacan-content` | Items, metadata values, documents |
| `tainacan-structure` | Collections, metadata definitions, sections, filters |
| `tainacan-media` | Attachments, file uploads |
| `tainacan-search` | Facets, search |
| `tainacan-admin` | Settings, capabilities, reports |
| `tainacan-rag` | Semantic search, vector spaces, indexing |

### Tier 1 — resource abilities (~40)

One-to-one with REST controllers. Pattern: `tainacan/<resource>-<verb>`.

| Abilities | Resource |
|---|---|
| `collection-list`, `-get`, `-create`, `-update`, `-delete` | Collections |
| `item-list`, `-get`, `-create`, `-update`, `-delete` | Items |
| `item-publish`, `item-unpublish` | Item status transitions |
| `item-metadata-get`, `-set` | Item metadata values |
| `metadata-list`, `-get`, `-create`, `-update`, `-delete` | Metadata definitions |
| `metadata-section-list`, `-get`, `-create`, `-update`, `-delete` | Metadata sections |
| `taxonomy-list`, `-get`, `-create`, `-update`, `-delete` | Taxonomies |
| `term-list`, `-get`, `-create`, `-update`, `-delete` | Terms |
| `filter-list`, `-get`, `-create`, `-update`, `-delete` | Filters |
| `facet-get` | Faceted search |
| `metadata-types-list`, `filter-types-list`, `exposers-list` | Introspection |
| `capabilities-get` | Role capabilities |
| `attachment-upload`, `attachment-get` | Media |

### Tier 2 — workflow abilities (~15)

Multi-step sequences as one intent:

| Ability | Purpose |
|---|---|
| `collection-scaffold` | Collection + metadata sections + metadata in one call |
| `item-create-with-metadata` | Item + metadata values + document attachment |
| `batch-items-create` | Many items with metadata, chunked internally |
| `bulk-edit-apply` | One ability with operation enum over 15 bulk-edit routes |
| `taxonomy-bulk-terms` | Bulk term insertion |
| `importer-session-create`, `-update`, `-run` | CSV/XLSX import |
| `exporter-session-create`, `-run` | Export |

### Tier 3 — escape hatch (1)

`tainacan/rest-request` takes `route`, `method`, `params`. Restricted to
`tainacan/v2` prefix. Enforces the target route's own permission callback.
Annotations: `readonly: false`, `idempotent: false`.

### RAG abilities

| Ability | Behaviour |
|---|---|
| `rag-status` | Spaces, dimensions, counts, queue depth, last index |
| `rag-configure` | Create or update a space, choose active space |
| `rag-index-collection` | Enqueue a collection for backfill |
| `rag-index-item` | Enqueue one item |
| `rag-search` | Query → scored items and snippets |
| `rag-similar-items` | Item → similar items |
| `rag-search-images` | Text → images, or image → images |
| `rag-answer` | Retrieve, then answer via a WP AI connector |
| `rag-hybrid-search` | Keyword + vector results merged by RRF |

## MCP exposure rules

Every agent-facing ability needs in its registration:

```php
'meta' => [
    'public'      => true,
    'mcp'         => [ 'type' => 'tool' ],
    'annotations' => [
        'readonly'    => true,      // → readOnlyHint
        'destructive' => false,     // → destructiveHint
        'idempotent'  => true,      // → idempotentHint
    ],
],
```

Without `meta.public` the ability exists but no agent can see it — this is the
most common silent failure.

## Agent workflow: build a collection end to end

The flagship sequence, and the acceptance test for the whole programme:

1. **Scaffold** — `tainacan/collection-scaffold` with collection name, metadata
   sections and metadata definitions.
2. **Upload files** — `tainacan/attachment-upload` per file, returns attachment IDs.
3. **Create items** — `tainacan/batch-items-create` with metadata values and
   document attachment IDs.
4. **Publish** — `tainacan/item-publish` for each item (or batch via bulk-edit).
5. **Enable search** — `tainacan/rag-configure` to create a vector space.
6. **Index** — `tainacan/rag-index-collection` to enqueue, then poll `rag-status`.
7. **Verify** — `tainacan/rag-search` to test retrieval quality.

## Vocabulary (exact terms)

Tainacan vocabulary is exact. Using wrong terms produces plausible but broken work.

| Term | Means | Is not |
|---|---|---|
| **Item** | A record in a collection | A WordPress post (in conversation) |
| **Metadatum** | A metadata definition | A custom field |
| **Item_Metadata_Entity** | The value of one metadatum for one item | A metadatum |
| **Collection** | The top-level container | A WordPress category |
| **Facet** | A filterable metadata dimension | A filter value |
| **Filter** | A UI component for faceted search | A facet |
| **Taxonomy** | A controlled vocabulary | A WordPress tag |
| **Exposer** | An output format (JSON, CSV, OAI-PMH) | An exporter |
| **Mapper** | Maps metadata to external standards | An exposer |

## Sub-skills

| File | Covers |
|---|---|
| [abilities-api.md](abilities-api.md) | Abilities API internals: registration, bridge, schemas |
| [agent-connection.md](agent-connection.md) | MCP, REST, WP-CLI connection; auth; least-privilege role |
| [agent-workflows.md](agent-workflows.md) | End-to-end playbooks: scaffold, ingest, verify, audit |
| [semantic-search.md](semantic-search.md) | RAG pipeline: vector spaces, providers, indexing, retrieval |
| [trust-boundary.md](trust-boundary.md) | Security model, what agents can and cannot do |
| [assisted-authoring.md](assisted-authoring.md) | AI features: alt-text, metadata suggestions, term proposals |
