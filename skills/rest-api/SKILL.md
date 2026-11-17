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

## Pitfalls

- `permission_callback` is mandatory; omitting it triggers `_doing_it_wrong`.
- Return `WP_REST_Response` or `WP_Error`, not raw arrays, when you need control
  over status codes.
- Sanitise every input in `args`; do not trust `$request->get_param()` directly.
- Endpoint classes must be reachable by the Tainacan autoloader — filename and
  namespace matter (see the `plugin-architecture` skill).
- Batch operations are capped by `TAINACAN_API_MAX_BATCH_TERMS` (default 200).
