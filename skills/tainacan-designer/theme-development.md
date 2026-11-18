
# Theme development

A theme is a different contract from a plugin. What in a plugin is a leak
(styling `body`, declaring a template function, assuming the entire page) in a
theme is the file's job; and what in a plugin is optional (escape in template,
conditional enqueue) in a theme separates one that coexists from one that
overrides page plugins.

## Deciding where code goes

| Request | Location | Why |
|---|---|---|
| New section on item page | template part in `tainacan/single-items.php` | Theme Helper hierarchy |
| New list view mode | `tainacan_register_view_mode()` on `after_setup_theme` + template in `tainacan/view-mode-<slug>.php` | Appears in Tainacan menu |
| Style over Tainacan list | Own stylesheet enqueued only on list page | HTML is Vue from plugin; theme controls CSS |
| Per-collection adjustment | `tainacan_register_admin_hook( 'collection', ... )` + flat meta | Only way for Vue collection form to pre-fill |
| Appearance option | `customize_register` with `transport => postMessage` | Appearance is chosen visually |
| Feature toggle | Own page via `add_theme_page()`, not Customizer | Customizer column is narrow |

## Non-negotiable rules

- **Escape at output point in every template.** `esc_html()` for text,
  `esc_attr()` for attributes, `esc_url()` for `href`/`src`,
  `wp_kses_post()` for intentional HTML.
- **Never read superglobals directly in templates.** A theme utility does
  `sanitize_text_field( wp_unslash( $_GET[...] ) )` in one place.
- **URL from URL requires origin validation.** A parameter like `?ref=` printed
  in an `href` is reflected XSS if any value is accepted. Accept only own-site
  URLs (`wp_http_validate_url()` + host comparison).
- **No external servers.** No fonts, scripts or CSS from CDNs: the visitor's IP
  goes to third parties. System typography by default; webfonts vendorised.
- **Conditional enqueue.** Each file loads only on the page that needs it.
- **`MutationObserver` on document must not write to DOM without disconnecting
  first.** The Tainacan list is a Vue app that constantly changes the DOM;
  observing `document.body` and writing creates an infinite loop.
- **Callback route must point to an existing method.** A missing
  `validate_callback` method returns 500 on every route request.
- **Template variables must not collide with WordPress globals.** `$post_type`,
  `$order`, `$post`, `$query` assigned in a template overwrite the global.
- **Inherited hooks must not be renamed.** In a fork, the original theme's
  actions continue firing at the same positions.
- **Every asset version comes from the theme constant.**

## Theme Helper templates

Templates in `tainacan/` at the theme root, loaded by the plugin when present:

| File | When |
|---|---|
| `tainacan/archive-items.php` | Collection item listing |
| `tainacan/archive-repository.php` | Repository-wide item listing |
| `tainacan/archive-taxonomy.php` | Taxonomy items |
| `tainacan/archive-terms.php` | Taxonomy term listing |
| `tainacan/single-items.php` | Single item page |
| `tainacan/view-mode-<slug>.php` | Custom view mode registered by theme |

## Three Tainacan signatures that silently fail

| Call | Wrong | Correct | Effect |
|---|---|---|---|
| `tainacan_get_collection()` | `tainacan_get_collection( $id )` | `tainacan_get_collection( array( 'collection_id' => $id ) )` | Receives array of args; with an id, ignores the argument |
| `tainacan_get_the_metadata()` one | `'metadata' => array( $id )` | `'metadata' => (int) $id` | With array, returns empty string |
| `tainacan_get_the_metadata()` many | `'metadata' => $ids` | `'metadata__in' => $ids` | The list has its own argument |

## Theme release checks

- `Version` in `style.css` header (without it no update or cache break).
- Same version in header, `functions.php` constant, `Stable tag` in
  `readme.txt` and `package.json`.
- Complete `readme.txt` fields.
- Text Domain equals folder name.
- Sass newer than compiled CSS triggers a warning.
