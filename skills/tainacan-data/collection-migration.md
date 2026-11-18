
# Collection migration

## Non-negotiable principle

The source value arrives intact. No silent normalisation: case, whitespace,
punctuation, duplicates, dates and diacritics stay as they are in the source
unless a transformation rule has been **decided and recorded** with the
collection owner. Every transformation preserves the original column for
verification.

## Workflow

1. **Source inventory**: tables or fields, record count per entity, types,
   multi-valued fields, hierarchies, attachments (count, size, formats).
   Read-only on the source.
2. **Metadata map**: source -> Tainacan collection/metadatum, metadatum type,
   required, multi-value, taxonomy (new or existing), controlled vocabulary.
   Open decisions are listed for the owner; do not invent.
3. **Extraction**: reproducible script (versioned), reading from the source and
   writing intermediate files without touching values. Encoding verified
   (source Latin-1/CP1252 -> UTF-8 without loss; test with accented sample).
4. **Import CSV**: multi-value separator matching the importer configuration;
   compound fields and relationships in the format the importer accepts;
   special IDs (`special_document`, `special_attachments`,
   `special_item_status`) verified against the Tainacan version in use.
5. **Rehearsal**: import a stratified sample (records covering all cases: empty,
   multi-value, accented, hierarchical, large attachment) in a test environment.
   Compare field by field with the source.
6. **Full import** in test environment, then production, with logs disabled
   during load (`disable_logs()`), in batches.
7. **Reconciliation**: count per collection, per filled metadatum and per term,
   on each side: source x CSV x Tainacan database x search index (if any).
   Any difference must have a recorded explanation.

## Pitfalls

- Import that says "success" with empty fields: entity without `validate()`
  (swallowed exception), string sent to multi-value metadatum without handling,
  `explode` ignoring the actual separator in `value_as_string`.
- Taxonomy: value "7" becomes a term named "7" if the importer received the ID
  as a name.
- Two metadata on the same taxonomy erase each other: `wp_set_object_terms`
  from one removes the terms of the other.
- Bulk `UPDATE` on `wp_postmeta` to "fix" afterwards corrupts serialised data.
  Fix at source and re-import, or use the API.
- Attachments: check max upload size, execution time and disk space beforehand.

## Deliverable

Reconciliation spreadsheet or report, list of transformation decisions with
who decided, versioned scripts, and what remains pending.
