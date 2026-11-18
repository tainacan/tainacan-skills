# Assisted authoring

The only inference WordPress performs: single-shot, proposal-only features that
call external providers through WordPress AI connectors. These cannot write.

## Existing integration

`Tainacan\Integrations\WordPress_AI` (singleton) checks whether the WordPress AI
plugin is active and whether specific AI abilities are available:

```php
$wp_ai = WordPress_AI::get_instance();
$wp_ai->is_active();                        // AI plugin loaded?
$wp_ai->is_alt_text_generation_available();  // alt-text ability usable?
```

The alt-text check verifies three things:
1. The WordPress AI plugin is active (`WPAI_VERSION` defined).
2. `wp_has_ability('ai/alt-text-generation')` returns true.
3. The AI plugin has credentials and a vision-capable model available.

## Assisted features

| Feature | Input | Output | Gate |
|---|---|---|---|
| `tainacan/ai-describe-image` | Attachment | Alt text + description | Vision model available |
| `tainacan/ai-suggest-metadata` | Item form state + document text | Proposed values for text/date metadata | Per-feature setting |
| `tainacan/ai-suggest-terms` | Item content | Proposed existing terms from collection taxonomies | Per-feature setting |
| `tainacan/ai-summarize-document` | Extracted text | Summary for content index or RAG | Per-feature setting |

## Design constraints

### Suggest-terms only proposes existing terms

`ai-suggest-terms` may only choose from terms that already exist in the
collection's taxonomies. Creating vocabulary as a side effect of assistance is
how taxonomies rot. The ability receives the full term list and the model selects
from it.

### Output is validated before reaching the form

A proposed value that fails the metadatum's validation rules is shown as
rejected, never silently coerced. The validation runs against the metadata
definition: type constraints, required fields, allowed values.

### Annotations mark these as read-only

```php
'meta' => [
    'public'      => true,
    'mcp'         => [ 'type' => 'tool' ],
    'annotations' => [
        'readonly'    => true,
        'destructive' => false,
        'idempotent'  => true,
    ],
],
```

They persist nothing. The `tainacan-assist` category groups them separately from
write abilities.

### Per-feature enablement

Each feature has an independent on/off switch in the Tainacan settings. A site
administrator enables only what they want. The switches are:

- `tainacan_ai_describe_image_enabled`
- `tainacan_ai_suggest_metadata_enabled`
- `tainacan_ai_suggest_terms_enabled`
- `tainacan_ai_summarize_document_enabled`

### MCP exposure

Assisted features are exposed to MCP clients. An external agent generating alt
text is a legitimate use — it is still the client making the decision to accept
or reject the proposal.

## Using assisted features from an agent

An agent can call these abilities to get proposals, then decide whether to apply
them:

```
1. tainacan/ai-describe-image  → get alt text proposal
2. tainacan/item-metadata-set  → apply the accepted proposal (separate call)
```

The two-step pattern is the trust boundary at work: the first call proposes, the
second call commits. The agent (or human) decides between them.

### Batch alt-text workflow

For a collection of items with image documents:

1. `tainacan/item-list` with `per_page=20` to paginate through items.
2. For each item with an image document:
   - `tainacan/ai-describe-image` with the attachment ID.
   - Review the proposed alt text (agent applies quality checks).
   - `tainacan/item-metadata-set` to write the accepted alt text.
3. Log the acceptance rate and any rejections for audit.

### Metadata suggestion workflow

For items with extracted document text:

1. `tainacan/ai-suggest-metadata` with the item form state.
2. The response includes proposed values for each metadata field, with confidence.
3. Apply high-confidence suggestions automatically, flag low-confidence ones for
   human review.
4. `tainacan/item-metadata-set` for each accepted value.

## WordPress AI plugin requirements

The assisted features depend on the WordPress AI plugin being active with:

- At least one configured AI connector (in Settings → Connectors).
- Credentials that authenticate successfully.
- For image description: a vision-capable model (supports text + image input
  modalities).

The connector registry checks:

```php
$requirements = new ModelRequirements(
    [ CapabilityEnum::textGeneration() ],
    [ new RequiredOption(
        OptionEnum::inputModalities(),
        [ ModalityEnum::text(), ModalityEnum::image() ]
    ) ]
);
```

If no connector meets the requirements, the feature reports unavailable rather
than failing silently.

## Privacy considerations

- Private and draft items are excluded by default from assisted features.
- Every inference call is logged with the provider and model used.
- Item content sent to external providers is controlled by the per-feature
  enablement — a disabled feature sends nothing.
- Credentials for AI providers live in `wp_options` and are managed through
  WordPress AI's Settings → Connectors, not through Tainacan.
