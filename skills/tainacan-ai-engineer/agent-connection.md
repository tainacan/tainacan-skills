# Agent connection

How to connect an external agent to a Tainacan site: authentication,
transport, and the least-privilege role that keeps the blast radius small.

## Connection modes

### MCP over HTTP (preferred for agent clients)

Requires the MCP adapter plugin installed on the WordPress site. The adapter
exposes every ability with `meta.public = true` as an MCP tool.

1. Install and activate the MCP adapter plugin.
2. Create a dedicated WordPress user with the agent role (see below).
3. Generate an application password for that user.
4. Configure the MCP client with the site URL and credentials.

Transport permission in the MCP adapter gates the whole server — treat it as an
additional layer, never as the only permission check.

### Direct REST

Application password over HTTP. Abilities are available at
`/wp-abilities/v1/abilities` and `/wp-abilities/v1/abilities/{name}/run`.

```sh
# List all Tainacan abilities
curl -u agent:xxxx-xxxx-xxxx-xxxx \
  https://example.com/wp-json/wp-abilities/v1/abilities?per_page=100

# Execute an ability
curl -u agent:xxxx-xxxx-xxxx-xxxx \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"input": {"per_page": 10}}' \
  https://example.com/wp-json/wp-abilities/v1/abilities/tainacan/collection-list/run

# The Tainacan REST API is also directly accessible
curl -u agent:xxxx-xxxx-xxxx-xxxx \
  https://example.com/wp-json/tainacan/v2/collections
```

### WP-CLI

Useful for verification and bulk work. Not suitable for remote agents on
managed hosts.

```sh
# List abilities
wp tainacan abilities list

# Execute an ability
wp tainacan abilities run tainacan/collection-list --input='{"per_page":5}'

# Direct repository access
wp tainacan collection list
```

In the Docker stack: `make wp ARGS="tainacan abilities list"`.

## Application passwords

WordPress application passwords authenticate REST and abilities requests.
Create one under Users → Edit User → Application Passwords.

- Each password is a 24-character token displayed once.
- Send it as HTTP Basic auth: `Authorization: Basic base64(username:password)`.
- Application passwords bypass 2FA and cookie-based auth.
- Revoke from the same screen when the agent is decommissioned.

## Least-privilege agent role

Create a custom role with the minimum capabilities:

```php
add_role( 'tainacan_agent', 'Tainacan Agent', [
    'read'                           => true,
    'upload_files'                   => true,
    'tainacan_edit_collections'      => true,
    'tainacan_edit_items'            => true,
    'tainacan_edit_metadata'         => true,
    'tainacan_edit_filters'          => true,
    'tainacan_edit_taxonomies'       => true,
    'tainacan_read_private_items'    => true,
    'tainacan_read_private_collections' => true,
] );
```

The role must **not** have:

- `manage_options` — except for `rag-configure` and `rag-answer`; create a
  separate admin user for those if needed
- `manage_users` — agents must not create or modify users
- `activate_plugins` — agents must not change site configuration
- `edit_others_posts` — stay within Tainacan's own capability model
- `delete_others_posts` — destructive cross-user operations

Per-collection capabilities are checked by the controllers, so the agent role
works across all collections. To restrict by collection, use Tainacan's
per-collection role mapping in the Roles admin.

## Security checklist

1. Never share the administrator password with an agent.
2. Use a dedicated user, not a shared account.
3. Scope the MCP transport permission to the agent role.
4. Monitor `Tainacan\Logs` for unexpected write patterns.
5. Revoke the application password when the agent is no longer needed.
6. Keep `DISALLOW_FILE_MODS` active (`make harden`).
7. Credentials never appear in skill files, manifests, or ability responses.

## Local development (tainacan-docker)

The Docker stack exposes WordPress at `http://localhost:${WP_PORT}` (default
8080). Default credentials from `.env`: `tainacan` / `tainacan`.

```sh
# Create an application password for testing
make wp ARGS="user application-password create 1 'agent-test' --porcelain"

# Test an ability
curl -u tainacan:$(cat /tmp/app-password) \
  http://localhost:8080/wp-json/wp-abilities/v1/abilities/tainacan/collection-list/run \
  -X POST -H 'Content-Type: application/json' -d '{"input":{}}'
```

The container cannot reach `http://localhost:8080` from inside. Background
processes and loopback calls use `http://nginx` instead
(`TAINACAN_BG_PROCESS_LOOPBACK_URL`). The abilities bridge avoids this problem
entirely by calling controller callbacks directly, never via HTTP.
