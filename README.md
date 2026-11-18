# Tainacan Skills

Reusable agent skills for developing the [Tainacan](https://tainacan.org)
WordPress plugin and its ecosystem.

## Install

```sh
npx tainacan-skills
```

Interactive prompt lets you pick which skills to install into `.claude/skills/`.

Or install specific skills directly:

```sh
npx tainacan-skills install tainacan-developer
npx tainacan-skills install tainacan-designer tainacan-data
npx tainacan-skills install  # all skills
```

## Skills

Five skills organised by persona. Load the one that fits your task — it
includes a quick reference and links to detailed sub-skill files inside its
directory.

| Skill | Load when | Contents |
|---|---|---|
| [`tainacan-developer`](skills/tainacan-developer/SKILL.md) | Writing PHP, REST API, data model, tests, build pipeline | plugin-architecture, data-model, rest-api, hooks-and-extensions, testing, build-pipeline, dev-environment |
| [`tainacan-designer`](skills/tainacan-designer/SKILL.md) | Working on Vue admin, themes, UI components, frontend assets | vue-admin, ui-admin, theme-development |
| [`tainacan-extend`](skills/tainacan-extend/SKILL.md) | Building plugins or integrations on top of Tainacan | plugin-scaffold, plugin-coexistence |
| [`tainacan-ops`](skills/tainacan-ops/SKILL.md) | Reviewing, releasing, validating, diagnosing, contributing | guardrails, validation, code-review, diagnostics, release, wordpress-org, core-contribution, lessons-learned |
| [`tainacan-data`](skills/tainacan-data/SKILL.md) | Migrating collections, Elasticsearch, performance tuning | collection-migration, elasticsearch, performance, background-processes |
| [`tainacan-ai-engineer`](skills/tainacan-ai-engineer/SKILL.md) | Connecting agents via Abilities API, MCP, RAG, semantic search | abilities-api, agent-connection, agent-workflows, semantic-search, trust-boundary, assisted-authoring |

Shared knowledge (hooks, build pipeline, background processes) lives in one
skill and is referenced from others that need it.

## Repository structure

```
tainacan-skills/
  README.md
  skills/
    tainacan-developer/          core plugin development
      SKILL.md                   entry point + quick reference
      plugin-architecture.md     autoloader, namespaces, entities, repos
      data-model.md              collections, items, metadata, taxonomies
      rest-api.md                endpoints, controllers, permissions, queries
      hooks-and-extensions.md    hooks, extension points, capabilities
      testing.md                 PHPUnit, factories, REST tests
      build-pipeline.md          npm, webpack, sass, composer
      dev-environment.md         Docker stack, make targets, troubleshooting
    tainacan-designer/           UI and theme development
      SKILL.md
      vue-admin.md               Vue 3 admin SPA, components, Gutenberg
      ui-admin.md                Pages API, form hooks, drawer, REST writes
      theme-development.md       Theme Helper, templates, view modes, Sass
    tainacan-extend/             building on top of Tainacan
      SKILL.md
      plugin-scaffold.md         new plugin structure, skeleton, quality
      plugin-coexistence.md      multi-plugin compatibility, naming, CSS/JS
    tainacan-ops/                quality, review, release, contribution
      SKILL.md
      guardrails.md              safe code change workflow
      validation.md              pre-commit checks, lint, phpcs, Plugin Check
      code-review.md             review by role: security, perf, correctness
      diagnostics.md             bug investigation: reproduce, isolate, fix
      release.md                 semver, git-flow, build, ZIP, tag
      wordpress-org.md           Plugin Check compliance, directory review
      core-contribution.md       contributing to core: GitFlow, tests, PR
      lessons-learned.md         capturing reusable knowledge
    tainacan-data/               data management at scale
      SKILL.md
      collection-migration.md    legacy migration: inventory, CSV, reconcile
      elasticsearch.md           ElasticPress integration, indexing, search
      performance.md             bottlenecks, measurement, safe optimisation
      background-processes.md    importers, exporters, bulk edit, heartbeat
    tainacan-ai-engineer/        AI agents and WordPress Abilities
      SKILL.md                   entry point + quick reference
      abilities-api.md           registration, bridge, schemas, MCP exposure
      agent-connection.md        MCP, REST, WP-CLI, auth, least-privilege role
      agent-workflows.md         end-to-end playbooks: scaffold, ingest, verify
      semantic-search.md         RAG pipeline: vector spaces, indexing, retrieval
      trust-boundary.md          security model, what agents can and cannot do
      assisted-authoring.md      AI features: alt-text, metadata suggestions
```

## Usage

### With npx (recommended)

Run from any project directory to install skills into `.claude/skills/`:

```sh
npx tainacan-skills                        # interactive prompt
npx tainacan-skills install tainacan-developer  # specific skill
npx tainacan-skills install                # all skills
npx tainacan-skills list                   # see what's available
```

### With a sibling clone

Clone this repo as a sibling and reference it from your project's `CLAUDE.md`:

```
For Tainacan skills, see ../tainacan-skills/skills/
```

### Standalone

Each `SKILL.md` is a self-contained reference. The sub-skill `.md` files in the
same directory have the full detail on each topic.

## Origin

These skills consolidate knowledge from two sources:
- **tainacan-docker** `.agents/skills/` — the original 6 development environment skills
- **tainacan-stack-ia** — 16 workflow and quality skills (translated from Portuguese)

## Contributing

Each skill directory should:

- Have a `SKILL.md` with YAML frontmatter (`name`, `description` with trigger words)
- Contain sub-skill `.md` files for detailed reference on each topic
- Include concrete code examples, file paths, and commands
- Be written in English
- Stay current with the plugin's `develop` branch
