---
name: dev-environment
description: Use when setting up, running, debugging or changing the Tainacan local development stack. Triggers on "make setup", "make up", "make watch", "docker compose", "stack", "containers", "WordPress won't load", "read-only file system", "permissions", "port", "nginx 502", "php-fpm", "reset", "tainacan-docker", "dev environment".
---

# Tainacan development environment

The development stack is managed by the
[tainacan-docker](https://github.com/tainacan/tainacan-docker) repository. It
provides a containerised WordPress with the Tainacan plugin source mounted
directly — PHP edits are live, and a builder container handles asset compilation.

## Services

| Service | Image | Role | Published port |
|---|---|---|---|
| `db` | `mariadb:11` | Database, `db_data` volume, healthcheck | `${DB_PORT}` |
| `wordpress` | `wordpress:php8.3-fpm` + limits + WP-CLI | PHP-FPM on 9000 | — |
| `nginx` | `nginx:1.27-alpine` | Static files + FastCGI proxy | `${WP_PORT}` |
| `builder` | Custom (Node 22 + PHP 8.3 + Composer) | Asset builds, watch, tests | — |
| `elasticsearch` | ES 8.15 (optional) | Full-text search | `${ES_PORT}` |

Request flow: browser → `nginx:80` → static files or `fastcgi_pass wordpress:9000`
→ WordPress → `db`.

## Mounts

| Host path | Container path | Mode | Services |
|---|---|---|---|
| `${TAINACAN_PLUGIN_PATH}/src` | `/var/www/html/wp-content/plugins/tainacan` | read-only | wordpress, nginx |
| `${TAINACAN_PLUGIN_PATH}` | `/repo` | read-write | builder |

`TAINACAN_PLUGIN_PATH` defaults to `../tainacan` (sibling folder). Set it in
`.env` to point elsewhere; the stack appends `/src` for the web tier.

`wordpress_data` is a named volume holding WordPress core, `wp-config.php`, and
uploads. It is never on the host, keeping WordPress out of the repositories.

## Essential commands

```sh
make setup       # first run: build assets, start stack, install WP, harden
make up          # start db, wordpress, nginx
make watch       # rebuild assets on change (second terminal)
make assets      # one-shot development build
make assets-prod # production build
make down        # stop containers
make reset       # stop + delete data volumes (destructive)
make shell       # bash into wordpress container
make db-shell    # MariaDB shell
make wp ARGS="plugin list"   # run WP-CLI commands
make logs        # follow wordpress + nginx logs
make test        # PHPUnit suite
make guard       # check for WordPress file leaks
make bg-loopback # fix background processes stuck in "waiting"
make cron        # run due WP-Cron events
```

## Guard rails

- The plugin is mounted **read-only** for the web tier. Writes fail with
  "Read-only file system". Only the builder gets write access.
- `make guard` scans the plugin checkout for WordPress core artifacts and fails
  if any appear (wp-admin/, wp-content/, wp-config.php, etc.).
- `wp-config.php` hardening: `AUTOMATIC_UPDATER_DISABLED`,
  `WP_AUTO_UPDATE_CORE`, `DISALLOW_FILE_EDIT` are set on install.

## WP-CLI

WP-CLI runs inside the `wordpress` container (no separate CLI service):

- `make wp ARGS="..."` runs as uid 33 (www-data) — preferred for writes.
- `make shell` then `wp ...` runs as root with auto `--allow-root`.

## Why PHP edits are live

The plugin source is bind-mounted. Editing a PHP file is immediately visible in
WordPress. Only JS, Vue, and SCSS need a build step.

## Why watch uses polling

Docker Desktop on macOS does not deliver inotify events from host files into
Linux containers. The watchers poll every 2 seconds. This is intentional.

## Troubleshooting

| Symptom | Fix |
|---|---|
| nginx 502 | php-fpm not ready; check `make logs` and `make ps` |
| Port in use | Change `WP_PORT` in `.env` |
| Blank admin / missing styles | Run `make assets` |
| DB connection error | Wait for healthcheck or check `.env` credentials |
| Permalinks 404 | `docker compose up -d --force-recreate nginx` |
| ES container exits | Raise `vm.max_map_count` |
| `.env` changes not applied | Recreate affected containers |
| Background process stuck in "waiting" | Run `make bg-loopback` |
| WP-Cron events not firing | Run `make cron` |
| "Operation not permitted" on plugin files | Stale bind mount; recreate containers |

## Pitfalls

- Do not add `container_name` to services; multiple stacks may coexist.
- Do not bind-mount the repo root as the document root; WordPress files would
  leak into the repository.
- `node_modules` is a named volume, not on the host, for macOS I/O performance.
