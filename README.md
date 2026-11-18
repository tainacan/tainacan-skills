# Tainacan Skills

Reusable agent skills for developing the [Tainacan](https://tainacan.org)
WordPress plugin and its ecosystem. Each skill is a focused knowledge module
that a coding agent loads on demand.

## Skill index

Skills are organised in four tiers:

### Core — how the plugin works

| Skill | Covers |
|---|---|
| [`plugin-architecture`](skills/plugin-architecture/SKILL.md) | Autoloader, namespaces, entities, repositories, singleton pattern, file conventions |
| [`data-model`](skills/data-model/SKILL.md) | Collections, items, metadata, taxonomies, filters, metadata sections, item metadata |
| [`rest-api`](skills/rest-api/SKILL.md) | Endpoints, controllers, permissions, querying, consuming the API, exposers, mappers, OAI-PMH |
| [`hooks-and-extensions`](skills/hooks-and-extensions/SKILL.md) | WordPress hooks, extension points, admin form hooks, faceted search hooks, capabilities, roles |

### Workflow — how to develop

| Skill | Covers |
|---|---|
| [`build-pipeline`](skills/build-pipeline/SKILL.md) | npm, webpack, sass, composer, asset enqueueing, `build.sh` |
| [`vue-admin`](skills/vue-admin/SKILL.md) | Vue 3 admin app, component architecture, metadata types, filter types, Gutenberg blocks |
| [`ui-admin`](skills/ui-admin/SKILL.md) | Plugin UI in Tainacan admin: Pages API, form hooks, drawer pattern, REST metadata writes |
| [`testing`](skills/testing/SKILL.md) | PHPUnit wiring, factories, REST tests, writing and running tests |
| [`dev-environment`](skills/dev-environment/SKILL.md) | Docker stack (tainacan-docker), services, mounts, make targets, troubleshooting |
| [`guardrails`](skills/guardrails/SKILL.md) | Safe code change workflow: understand, plan, implement, verify |
| [`validation`](skills/validation/SKILL.md) | Pre-commit/delivery checks: static analysis, lint, phpcs, tests, Plugin Check |
| [`code-review`](skills/code-review/SKILL.md) | Technical review by role: security, performance, Tainacan API, coexistence, correctness |
| [`diagnostics`](skills/diagnostics/SKILL.md) | Bug investigation: reproduce, check known issues, isolate, fix and prove |
| [`lessons-learned`](skills/lessons-learned/SKILL.md) | Capturing reusable knowledge: automated rules, reference lessons, project notes |

### Integrations — optional features

| Skill | Covers |
|---|---|
| [`background-processes`](skills/background-processes/SKILL.md) | Importers, exporters, bulk edit, generic processes, heartbeat, cron |
| [`elasticsearch`](skills/elasticsearch/SKILL.md) | ElasticPress integration, search engine abstraction, indexing, faceted search |
| [`performance`](skills/performance/SKILL.md) | Diagnosis and optimisation for large collections: bottlenecks, measurement, safe changes |
| [`plugin-coexistence`](skills/plugin-coexistence/SKILL.md) | Multi-plugin compatibility: collisions, naming, hooks, CSS/JS, joint review |

### Ecosystem — publishing and extending

| Skill | Covers |
|---|---|
| [`plugin-scaffold`](skills/plugin-scaffold/SKILL.md) | Creating new plugins that extend Tainacan: structure, skeleton, quality from day one |
| [`theme-development`](skills/theme-development/SKILL.md) | WordPress themes for Tainacan: Theme Helper, templates, view modes, Customizer, Sass |
| [`collection-migration`](skills/collection-migration/SKILL.md) | Migrating collections from legacy systems: inventory, metadata map, CSV, reconciliation |
| [`release`](skills/release/SKILL.md) | Version publishing: checklist, semver, build, ZIP, tag, git-flow |
| [`wordpress-org`](skills/wordpress-org/SKILL.md) | Plugin Check compliance, directory review, finding hierarchy, readme, uninstall |
| [`core-contribution`](skills/core-contribution/SKILL.md) | Contributing to tainacan/tainacan: GitFlow, build, tests, PR template, compatibility |

## Usage

### With Claude Code (recommended)

Clone this repo as a sibling to your Tainacan projects and reference it from
your project's `CLAUDE.md` or `AGENTS.md`:

```
For Tainacan plugin skills, see ../tainacan-skills/skills/
```

Or symlink individual skills into your project's `.claude/skills/` directory:

```sh
ln -s ../../tainacan-skills/skills/rest-api .claude/skills/tainacan-rest-api
```

### Standalone

Each `SKILL.md` is a self-contained reference document. Read it directly when
you need guidance on that area of Tainacan development.

## Origin

These skills consolidate knowledge from two sources:
- **tainacan-docker** `.agents/skills/` — the original 6 development environment skills
- **tainacan-stack-ia** — 16 workflow and quality skills (translated from Portuguese)

## Contributing

Each skill should:

- Have a single `SKILL.md` with YAML frontmatter (`name`, `description` with
  trigger words)
- Cover one coherent area — not too broad, not too narrow
- Include concrete code examples, file paths, and commands
- Be written in English
- Stay current with the plugin's `develop` branch
