---
name: elasticsearch
description: Use when enabling, configuring, debugging or indexing Tainacan with Elasticsearch. Triggers on "elasticsearch", "elasticpress", "search engine", "index", "facets slow", "vm.max_map_count", "9200", "cluster health", "reindex", "Search_Engine", "integrations", "faceted search".
---

# Tainacan and Elasticsearch

Tainacan can serve faceted search from MySQL (default) or from Elasticsearch.
Elasticsearch is optional and provides better performance for large collections
with complex faceted queries.

## How the integration works

| Class | Location | Role |
|---|---|---|
| `Search_Engine` | `classes/class-tainacan-search-engine.php` | Abstraction that routes queries to MySQL or Elasticsearch |
| `Elastic_Press` | `classes/integrations/class-tainacan-elastic-press.php` | ElasticPress adapter for current versions |
| `Elastic_Press_Lte4` | `classes/integrations/class-tainacan-elastic-press-lte4.php` | Adapter for ElasticPress 4 and older |

Tainacan does not require the ElasticPress admin UI; the integration is wired
through Tainacan's own settings.

## Enabling Elasticsearch

### In a Docker stack

```sh
make up-elastic     # starts ES 8.15 single node with security disabled
```

This merges `docker-compose.elastic.yml`, which adds an ES container reachable
from WordPress at `http://elasticsearch:9200` with a named `es_data` volume.

### Configuration

1. Start the Elasticsearch service.
2. In Tainacan admin → Settings, enable the Elasticsearch engine.
3. Set the host to `elasticsearch:9200` (or the appropriate host).
4. Index the content (Tainacan reindex action or ElasticPress command).

### Verification

```sh
# Check cluster health
curl -s http://localhost:9200/_cluster/health | jq

# Check from WP-CLI
make wp ARGS="option get tainacan_search_engine"
```

- Cluster health should be `yellow` or `green`.
- Faceted search returns results and filters narrow them.
- Compare filtered query counts before and after enabling; they should match.

## System requirements

Elasticsearch needs `vm.max_map_count >= 262144`:

```sh
# Linux
sudo sysctl -w vm.max_map_count=262144

# macOS (Docker Desktop VM usually satisfies this already)
```

## Version compatibility

The Docker stack ships ES 8.15. Tainacan's integration has been validated against
ES 7.x historically, with ES 8 support in newer ElasticPress versions. If you see
version incompatibility errors, change the image tag in the override file:

```yaml
image: docker.elastic.co/elasticsearch/elasticsearch:7.17.24
```

The `-lte4` integration class handles older ElasticPress versions.

## Backing out

1. Disable the Elasticsearch engine in Tainacan settings.
2. Search falls back to MySQL automatically.
3. Stop the ES service and optionally remove the volume:

```sh
docker volume rm tainacan-docker_es_data
```

## Pitfalls

- Indexing is asynchronous; a change is not searchable until the index catches up.
- Re-index after bulk imports, or facets will be stale.
- `es_data` is a separate volume; deleting it loses the index (re-index required).
- Security is disabled in development. Do not reuse this configuration in
  production.
- ES memory is pinned to 512m via `ES_JAVA_OPTS`; raise it for large collections.
