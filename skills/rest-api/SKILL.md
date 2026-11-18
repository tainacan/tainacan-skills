---
name: rest-api
description: Use when adding, changing, testing or calling Tainacan REST endpoints. Triggers on "REST API", "endpoint", "tainacan/v2", "register_routes", "permission_callback", "wp-json", "exposer", "OAI-PMH", "paginate", "metaquery", "API controller", "application password", "nonce", "Rest_Controller".
---

# Tainacan REST API

## Namespace and conventions

- Namespace: `tainacan/v2` (constant `TAINACAN_REST_NAMESPACE` in
  `src/classes/api/tainacan-rest-creator.php`).
- Base URL: `{site}/wp-json/tainacan/v2/...`
- Controllers live in `src/classes/api/endpoints/` and extend
  `Tainacan\API\Rest_Controller`, which sets `$this->namespace` and calls
  `register_routes()` on `rest_api_init`.

## Existing controllers

One controller per resource:

| Resource | Endpoint pattern |
|---|---|
| Collections | `/collections`, `/collections/{id}` |
| Items | `/collection/{id}/items`, `/items/{id}` |
| Metadata | `/collection/{id}/metadata`, `/metadata/{id}` |
| Metadata Types | `/metadata-types` |
| Metadata Sections | `/collection/{id}/metadata-sections` |
| Metadatum Mappers | `/metadatum-mappers` |
| Item Metadata | `/item/{id}/metadata`, `/item/{id}/metadata/{metadatum_id}` |
| Taxonomies | `/taxonomies`, `/taxonomies/{id}` |
| Terms | `/taxonomy/{id}/terms` |
| Filters | `/collection/{id}/filters`, `/filters/{id}` |
| Filter Types | `/filter-types` |
| Facets | `/collection/{id}/facets/{metadatum_id}` |
| Logs | `/logs` |
| Roles | `/roles` |
| Reports | `/reports` |
| Importers | `/importers` |
| Exporters | `/exporters` |
| Background Processes | `/bg-processes` |
| Bulk Edit | `/collection/{id}/bulk-edit` |
| Exposers | `/exposers` |
| Sequence Edit | `/collection/{id}/sequence-edit` |
| OAI-PMH | `/oai` (XML output) |

## Adding an endpoint

1. Create `src/classes/api/endpoints/class-tainacan-rest-<resource>-controller.php`.
2. Declare the class in the `Tainacan\API\EndPoints` namespace.
3. Extend `Rest_Controller`.
4. Implement `register_routes()` with `methods`, `callback`,
   `permission_callback` and `args` (with `validate_callback` and
   `sanitize_callback`).
5. Every route **must** have an explicit `permission_callback`.
6. Wire the controller in the API creator, following existing patterns.

Skeleton:

```php
namespace Tainacan\API\EndPoints;

class Rest_My_Resource_Controller extends \Tainacan\API\Rest_Controller {
    protected function __construct() {
        $this->rest_base = 'my-resource';
        parent::__construct();
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args'                => $this->get_collection_params(),
            ],
        ]);
    }
}
```

## Permissions

Use capabilities from `Tainacan\Roles` (e.g. `tainacan_edit_items`,
`tainacan_read_private_items`). Permission callbacks return `true`, `false`, or
a `WP_Error` with an appropriate status code.

## Querying items

The items endpoint supports:

| Parameter | Purpose |
|---|---|
| `page`, `perpage` | Pagination (capped by `TAINACAN_API_MAX_ITEMS_PER_PAGE`) |
| `metaquery` | Filter by metadata values |
| `taxquery` | Filter by taxonomy terms |
| `orderby`, `order` | Sort results |
| `search` | Full-text search |
| `fetch_only` | Restrict returned fields |

## Calling the API

```sh
# Public read
curl -s '{site}/wp-json/tainacan/v2/collections' | jq

# Authenticated write (application password)
curl -s -u 'tainacan:APPPASSWORD' \
  -X POST '{site}/wp-json/tainacan/v2/collections' \
  -H 'Content-Type: application/json' \
  -d '{"name":"My collection","status":"publish"}'
```

Browser requests use cookie auth with `X-WP-Nonce` from
`wp_create_nonce('wp_rest')`.

## Exposers and formats

The exposers layer (`Tainacan\Exposers`) provides alternative output formats:
JSON (default), HTML, CSV, XML, TXT, JSON-LD, and OAI-PMH. OAI-PMH is served
as raw XML at `/wp-json/tainacan/v2/oai` via `rest_pre_serve_request`.

## Mappers

`Tainacan\Mappers` maps Tainacan metadata to external standards (Dublin Core and
others) so exposed records validate against known schemas. Add mapper entries
rather than hardcoding output in controllers.

## Consuming the Tainacan REST API

Listing: `collection/<cid>/items` or `items`.

```
?perpage=24&paged=1
&fetch_only=title,thumbnail,url&fetch_only_meta=123,456
&taxquery[0][taxonomy]=tnc_tax_9&taxquery[0][terms][]=55&taxquery[0][operator]=IN
&metaquery[0][key]=123&metaquery[0][value]=1900&metaquery[0][compare]=>=&metaquery[0][metadatumtype]=NUMERIC
```

- **Without `fetch_only`**, each item comes with all metadata rendered
  (`value_as_html`): slow in listings. Always use `fetch_only` + `fetch_only_meta`.
- `taxquery` accepts `taxonomy`, `metadatum` (not `field`), `terms`, `operator`,
  `relation`. **`include_children` is discarded**: the filter always includes
  children.
- `metaquery` accepts `key`, `value`, `compare`, `relation`, `metadatumtype`
  (not `type`), and the core overrides the type by the registered filter's type.
- `perpage=-1`: in 1.0.x passes without limit (brings down the server on large
  collections); in 1.4.x caps to configured max. Always paginate.
- Total: header `X-WP-Total`. Query time: `X-Tainacan-Query-Time`.
- Short-circuit for external engine: filter `tainacan-api-get-items-alternate`.
- Extra fields: `tainacan-api-response-<entity>-meta` (check permission before
  exposing) and `tainacan-api-items-prepare-for-response`.

### Creating own REST routes

```php
add_action( 'rest_api_init', function () {
    register_rest_route( 'my-plugin/v1', '/items/(?P<id>\d+)', [
        'methods'             => WP_REST_Server::EDITABLE,
        'callback'            => [ $this, 'save' ],
        'permission_callback' => [ $this, 'can_edit' ],
        'args'                => [
            'id'   => [ 'type' => 'integer', 'required' => true, 'sanitize_callback' => 'absint' ],
            'text' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
        ],
    ] );
} );
```

- `permission_callback` always, never `'__return_true'`. Public read: callback
  that checks the resource exists and is public; otherwise drafts and private
  items leak. Public write (webhook, form): justify and protect differently
  (HMAC signature, captcha, rate limit).
- `args` with `validate_callback` and `sanitize_callback` at registration, not
  inside the handler: fail early, stays beside the declaration.
- Nothing with `@` in the route pattern: breaks the entire site REST API.
- Own prefixed namespace. Do not register the same route in two places.
- In the browser, send nonce `wp_rest` (`X-WP-Nonce`) for the session to count.
- Permission per Tainacan collection:
  `current_user_can( "tnc_col_{$id}_edit_items" )` or
  `$collection->user_can( 'edit_items' )`.
- Cache of response that depends on user (`can_read`, private items) must
  include the user or role in the key; otherwise anonymous inherits private data.

## Pitfalls

- `permission_callback` is mandatory; omitting it triggers `_doing_it_wrong`.
- Return `WP_REST_Response` or `WP_Error`, not raw arrays, when you need control
  over status codes.
- Sanitise every input in `args`; do not trust `$request->get_param()` directly.
- Endpoint classes must be reachable by the Tainacan autoloader — filename and
  namespace matter (see the `plugin-architecture` skill).
- Batch operations are capped by `TAINACAN_API_MAX_BATCH_TERMS` (default 200).
- `metaquery`/`taxquery` values pass through `wp_kses` without the `a` tag.
- The `permission_callback` only decides: no writes, counters or cache inside it.
