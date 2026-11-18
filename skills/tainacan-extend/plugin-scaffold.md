
# Plugin scaffold

## Contract before creating

Define with the requester: slug (lowercase with hyphens; becomes the folder and
Text Domain), name, short prefix for globals (e.g. `tnx_`), PHP namespace,
minimum PHP and WordPress (Tainacan 1.4 requires PHP 7.4 and WP 6.5), minimum
Tainacan version, licence (GPL-2.0-or-later or GPL-3.0, compatible with
Tainacan), and what the plugin does in one sentence. If missing, ask.

## Structure

```
<slug>/
  <slug>.php            header + constants + loading
  uninstall.php         removes options, tables and events
  readme.txt            WordPress.org standard
  CHANGELOG.md
  AGENTS.md             project section
  includes/             classes (namespace) or src/ with autoload
  assets/css  assets/js
  languages/
  tests/
```

## Main file

```php
<?php
/**
 * Plugin Name:       <Name>
 * Description:       <One sentence>
 * Version:           0.1.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Requires Plugins:  tainacan
 * Author:            <Author>
 * License:           GPL-3.0-or-later
 * Text Domain:       <slug>
 * Domain Path:       /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'TNX_VERSION', '0.1.0' );
define( 'TNX_FILE', __FILE__ );
define( 'TNX_DIR', plugin_dir_path( __FILE__ ) );

require_once TNX_DIR . 'includes/class-plugin.php';

add_action( 'plugins_loaded', [ '\Tnx\Plugin', 'boot' ] );
register_activation_hook( __FILE__, [ '\Tnx\Plugin', 'activate' ] );
register_deactivation_hook( __FILE__, [ '\Tnx\Plugin', 'deactivate' ] );
```

## Skeleton rules

- `boot()` checks for Tainacan
  (`class_exists( '\Tainacan\Repositories\Items' )`) and shows an admin notice
  if missing, without fatal.
- Every PHP file with `defined( 'ABSPATH' ) || exit;`.
- Assets only on the screens that use them, with prefixed handle and version
  `TNX_VERSION`.
- Strings with `__( '...', '<slug>' )`; `load_plugin_textdomain` only if there
  is a `languages/` directory.
- Deactivation cleans cron (`wp_clear_scheduled_hook`). Activation creates
  tables with `dbDelta` and stores the schema version in an option.
- Options in one array per group.

## Quality from the first commit

- `phpcs.xml.dist` with `WordPress-Core`, `WordPress-Extra`,
  `WordPress.Security`, `PHPCompatibilityWP`.
- `declare( strict_types=1 );` in every PHP; own namespace with PSR-4 autoload.
- Escape at output point, `wp_unslash` + `sanitize_*`, `gmdate`/`wp_date`,
  `wp_json_encode`, no CDN.
- JS with `wp.i18n`: `wp_set_script_translations()` after enqueue.

## After creating

1. `git init`, first commit.
2. Fill the project section in `AGENTS.md`: what it is, state, test
   environment, commands, gotchas, "do not regress".
3. Run validation checks without blocks.
