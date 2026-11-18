# Trust boundary

The security model for agents interacting with Tainacan. This is a design
invariant, not a preference.

## The fundamental rule

WordPress is a **deterministic capability server**. It never plans, never loops
over its own output, never chooses which action to take next. All agentic
behaviour happens in the client.

The model never gets the keys to the site. It gets proposals, and a human or an
explicitly-instructed external client does the committing.

## Eight rules, and how each is enforced

### 1. No server-side tool-calling loop

An ability callback may make at most one inference call, and must return data. It
never interprets a model response as a command to run another ability.

**Enforcement:** code review and test. The assist category's abilities are
structurally unable to call write abilities.

### 2. Inference output is a proposal, not a commit

Assisted features populate form state. Persisting requires a separate explicit
action — a human click, or an external agent calling a write ability.

**Enforcement:** assist classes depend on read paths and provider clients, never
on repository `insert()`/`update()`. A test asserts the assist category contains
no ability whose annotations claim write access.

### 3. Assisted features cannot write

The assist classes have no dependency on write paths. This is visible in review:
they import read-only repository methods, never `insert()` or `update()`.

**Enforcement:** dependency analysis and a test that scans the assist category.

### 4. Untrusted text stays data

Item titles, metadata values, filenames, OCR output and extracted PDF text are
attacker-controllable. They go into a delimited data block in a prompt, never
into the instruction portion. They can never change which ability runs or which
arguments are used.

**Enforcement:** the prompt template is fixed; user data fills placeholders
inside XML-delimited data blocks.

### 5. Egress is opt-in and visible

A site administrator enables each assisted feature individually. Where privacy
matters, private and draft items are excluded by default. Every call is recorded
in Tainacan Logs with the provider and model used.

**Enforcement:** per-feature settings in the admin, audit in Logs.

### 6. Spend is bounded

Per-feature enablement plus a request budget. A misconfigured client cannot run
up an invoice.

**Enforcement:** budget options in `wp_options`, checked before each provider call.

### 7. Credentials never travel in artifacts

Keys live in `wp_options`, are never returned by a route, and never appear in a
skill file or manifest. The admin UI shows configured/not-configured and a masked
field, never the actual key.

**Enforcement:** no API route includes credential fields in its response schema.

### 8. Least privilege for clients

An external agent connects with an application password belonging to a dedicated
role, not an administrator account. The MCP transport permission is scoped to
that role.

**Enforcement:** the connection guide ships a recommended role definition; the
admin screen shows a copy-paste configuration.

## Visibility in retrieval

A vector index has no concept of capabilities. The post-ANN visibility filter in
`Rag\Semantic_Search` re-fetches hits through the `Items` repository so:

- Collection privacy is enforced.
- `tainacan_read_private_items` is checked.
- Item status (draft, private, trash) is filtered.
- `Private_Files` restrictions apply.

This is not an optimisation detail — it is the security boundary. Tests assert
that hidden text never reaches a response.

## What agents can do

- Create, read, update, delete collections, items, metadata, taxonomies, terms,
  filters via registered abilities.
- Upload files and attach them to items.
- Run bulk operations (edit, import, export).
- Configure and query semantic search.
- Read logs and reports.

## What agents cannot do

- Run server-side code — abilities execute controller callbacks, not arbitrary PHP.
- Access other plugins' routes — `rest-request` is restricted to `tainacan/v2`.
- Bypass permission callbacks — every ability reuses the controller's permission
  check.
- Read credentials — keys are never in API responses.
- Create users or change roles — excluded from the agent role.
- Install or activate plugins — excluded from the agent role.
- Write to the filesystem — the plugin mount is read-only for the web tier.
- Trigger inference loops — ability callbacks return data, never instructions.

## Prompt injection defence

An agent that processes item content must treat it as untrusted. Specifically:

- Item titles and metadata values are attacker-controllable.
- Extracted document text (OCR, PDF) may contain injected instructions.
- Filenames can carry payloads.

The plugin's own assisted-authoring features place all user content inside
delimited data blocks in prompts. External agents should do the same.

An external agent that uses `rag-answer` is safe because the prompt is built
server-side with proper delimitation. An external agent that builds its own
prompts from `rag-search` results must delimit the snippets itself.

## Audit trail

Tainacan Logs record every write operation with:

- The user (agent user via application password).
- The action (create, update, delete, publish).
- The entity affected.
- Timestamp.

An agent should read logs after bulk operations to confirm the expected actions
were recorded. The hand-off audit playbook (in agent-workflows.md) includes
this check.
