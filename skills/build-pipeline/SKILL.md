---
name: build-pipeline
description: Use when building, compiling or debugging Tainacan front-end and PHP dependencies. Triggers on "npm", "webpack", "sass", "scss", "composer", "vendor", "assets", "build.sh", "enqueue", "styles not loading", "JS error in admin", "chunk", "production build", "compile-sass", "node_modules".
---

# Tainacan build pipeline

## Build outputs

| Output | Produced by | Consumed by |
|---|---|---|
| `src/vendor/` | `composer install` (vendor-dir is `src/vendor`) | PHP runtime, PHPUnit, PHPCS |
| `src/assets/js/*.js` | webpack (`npm run build` / `build-prod`) | `wp_enqueue_script` |
| `src/assets/css/*.css` | sass via `compile-sass.sh` | `wp_enqueue_style` |
| `src/style.css` | `compile-sass.sh` | Plugin stylesheet |

All of these are gitignored. They are build artifacts — never edit them by hand.

## The build script

`build.sh` orchestrates everything, gated by md5 checksums so unchanged steps
are skipped:

1. `npm ci` — when `package.json` / `package-lock.json` changed
2. `composer install` — when `composer.json` changed (`--no-dev` with `--prod`)
3. `sh compile-sass.sh` — when any `.scss` changed
4. `npm run build` or `npm run build-prod` — when any `.js`/`.vue` changed
5. `rsync` — publish step to a configurable path (harmless in dev)

**Checksum gotcha:** `build.sh` writes the checksum file even when a step fails,
so a failed `composer install` silently disables the Composer step on the next
run. If `src/vendor/` is missing, delete the checksum file and re-run, or use the
docker stack's `make vendor` target which checks for `autoload.php`.

## Webpack

Configuration files:
- `webpack.common.js` — entries and shared config
- `webpack.dev.js` — development mode (source maps)
- `webpack.prod.js` — production mode (minified, no `.js.map`)

Output: `src/assets/js/` with `publicPath` set to
`./wp-content/plugins/tainacan/assets/js/`.

Entries include admin pages, Gutenberg blocks, dashboard, and the command palette.

Loaders: Vue 3 SFCs, Babel, PostCSS, Sass. The `sass` package is resolved from
`node_modules`.

## Sass

`compile-sass.sh` compiles a **fixed list** of entry files (not a directory
glob) into `src/assets/css/*.css`. Each SCSS entry is an explicit line in the
script.

**Adding a new SCSS entry** requires editing `compile-sass.sh` and adding the
corresponding `wp_enqueue_style` call.

## WordPress asset enqueueing

Assets are registered with `TAINACAN_VERSION` as the version parameter for cache
busting. When adding a new entry:

1. Add the webpack entry to `webpack.common.js`.
2. Add the matching `wp_enqueue_script()` with correct dependencies.
3. For styles, add the SCSS entry to `compile-sass.sh` and the
   `wp_enqueue_style()` call.

## Running builds

In a docker stack (recommended):

```sh
make assets        # development build
make assets-prod   # production build (minified)
make watch         # rebuild on change (polling)
```

Standalone (requires Node.js 22+ and PHP 8.3+):

```sh
npm ci
composer install
sh compile-sass.sh
npm run build         # or: npm run build-prod
```

## Performance notes

- In a Docker setup, `node_modules` should be a named volume (not on the host
  bind mount) to avoid macOS file-sharing overhead.
- Watch mode polls every 2 seconds because Docker on macOS does not deliver
  inotify events into containers.
- `npm run build-prod` strips source maps and development-only files.

## Debugging

| Symptom | Cause / fix |
|---|---|
| Admin JS errors after `git pull` | Dependencies changed; run the build again (npm ci runs if lockfile changed) |
| `vendor/` missing | `composer install` has not run |
| Sass "file not found" | The path in `compile-sass.sh` does not match; check the explicit list |
| Changes not visible in watch mode | Polling interval is 2s; check builder logs |
| Webpack "Module not found" | Check import paths; Vue SFC imports need the `.vue` extension |

## Pitfalls

- Do not commit `src/vendor`, `src/assets/js`, `src/assets/css`, or
  `src/style.css`.
- Do not run npm or Composer as root on the host; use container targets.
- The plugin directory may be read-only in the web container; runtime code must
  not write to `src/`.
