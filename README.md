# Tainacan Skills

Reusable agent skills for developing the [Tainacan](https://tainacan.org)
WordPress plugin. Each skill is a focused knowledge module that a coding agent
loads on demand.

## Skill index

Skills are organised in three tiers:

### Core — how the plugin works

| Skill | Covers |
|---|---|
| [`plugin-architecture`](skills/plugin-architecture/SKILL.md) | Autoloader, namespaces, entities, repositories, singleton pattern, file conventions |
| [`data-model`](skills/data-model/SKILL.md) | Collections, items, metadata, taxonomies, filters, metadata sections, item metadata |
| [`rest-api`](skills/rest-api/SKILL.md) | Endpoints, controllers, permissions, querying, exposers, mappers, OAI-PMH |
| [`hooks-and-extensions`](skills/hooks-and-extensions/SKILL.md) | WordPress hooks fired by Tainacan, extension points, capabilities, roles |

### Workflow — how to develop

| Skill | Covers |
|---|---|
| [`build-pipeline`](skills/build-pipeline/SKILL.md) | npm, webpack, sass, composer, asset enqueueing, `build.sh` |
| [`vue-admin`](skills/vue-admin/SKILL.md) | Vue 3 admin app, component architecture, metadata types, filter types, Gutenberg blocks |
| [`testing`](skills/testing/SKILL.md) | PHPUnit wiring, factories, REST tests, writing and running tests |
| [`dev-environment`](skills/dev-environment/SKILL.md) | Docker stack (tainacan-docker), services, mounts, make targets, troubleshooting |

### Integrations — optional features

| Skill | Covers |
|---|---|
| [`background-processes`](skills/background-processes/SKILL.md) | Importers, exporters, bulk edit, generic processes, heartbeat, cron |
| [`elasticsearch`](skills/elasticsearch/SKILL.md) | ElasticPress integration, search engine abstraction, indexing, faceted search |

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

## Contributing

Each skill should:

- Have a single `SKILL.md` with YAML frontmatter (`name`, `description` with
  trigger words)
- Cover one coherent area — not too broad, not too narrow
- Include concrete code examples, file paths, and commands
- Be written in English
- Stay current with the plugin's `develop` branch
