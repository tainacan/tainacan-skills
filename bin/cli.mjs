#!/usr/bin/env node

import { cp, mkdir, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, '..', 'skills');

// Two project directories cover the editors that scan skills.
// `.agents/skills` is the shared Agent Skills path (Cursor, Codex, Gemini CLI,
// Antigravity, Copilot, OpenCode). Claude Code scans `.claude/skills` and does
// not read `.agents/skills`. Cursor also scans `.claude/skills`, so installing
// both can list each skill twice there; `--tools=agents` avoids that copy.
const DESTINATIONS = {
  agents: {
    dir: '.agents/skills',
    editors: 'Cursor, Codex, Gemini CLI, Antigravity, Copilot, OpenCode',
  },
  claude: {
    dir: '.claude/skills',
    editors: 'Claude Code',
  },
};

const SKILLS = {
  'tainacan-developer':   'Core plugin development: PHP, REST API, data model, testing, build pipeline',
  'tainacan-designer':    'UI and theme development: Vue admin, themes, components, assets',
  'tainacan-extend':      'Building on Tainacan: plugin scaffold, coexistence, integrations',
  'tainacan-ops':         'Quality and release: review, validation, diagnostics, release, contributing',
  'tainacan-data':        'Data at scale: migration, Elasticsearch, performance, bulk operations',
  'tainacan-ai-engineer': 'AI agents: Abilities API, MCP, RAG, semantic search, agent workflows',
};

const rl = createInterface({ input: process.stdin, output: process.stderr });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function listSkills() {
  console.log('\nTainacan Skills\n');
  for (const [name, desc] of Object.entries(SKILLS)) {
    console.log(`  ${name}`);
    console.log(`    ${desc}\n`);
  }
}

function normalizeTools(raw) {
  const names = raw
    .flatMap((value) => value.split(','))
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (names.length === 0 || names.includes('all'))
    return ['agents', 'claude'];

  const unknown = names.filter((name) => !DESTINATIONS[name]);
  if (unknown.length > 0) {
    console.error(`  Unknown tool "${unknown.join(', ')}". Use agents, claude, or all.`);
    return null;
  }

  return [...new Set(names)];
}

function parseArgs(argv) {
  const rawTools = [];
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tools') {
      const value = argv[++i];
      if (!value) {
        console.error('  --tools needs a value: agents, claude, or all.');
        return null;
      }
      rawTools.push(value);
    } else if (arg.startsWith('--tools=')) {
      rawTools.push(arg.slice('--tools='.length));
    } else {
      positionals.push(arg);
    }
  }

  const tools = normalizeTools(rawTools);
  if (!tools)
    return null;

  return { tools, positionals };
}

async function installSkills(names, tools) {
  const missing = [];
  for (const name of names) {
    if (!await exists(join(SKILLS_DIR, name)))
      missing.push(name);
  }

  if (missing.length === names.length) {
    for (const name of missing)
      console.error(`  ✗ Skill "${name}" not found`);
    return;
  }

  for (const tool of tools) {
    const destination = DESTINATIONS[tool];
    const targetDir = resolve(process.cwd(), destination.dir);
    await mkdir(targetDir, { recursive: true });

    for (const name of names) {
      if (missing.includes(name)) {
        console.error(`  ✗ Skill "${name}" not found`);
        continue;
      }

      await cp(join(SKILLS_DIR, name), join(targetDir, name), { recursive: true, force: true });
      console.log(`  ✓ ${name} → ${destination.dir}/${name}/`);
    }

    console.log(`    ${destination.editors}`);
  }

  console.log('\nDone.');
}

async function interactive(tools) {
  console.log('\n  Tainacan Skills Installer\n');
  console.log('  Which skills do you need?\n');

  const entries = Object.entries(SKILLS);
  for (let i = 0; i < entries.length; i++) {
    const [name, desc] = entries[i];
    console.log(`  [${i + 1}] ${name}`);
    console.log(`      ${desc}\n`);
  }
  console.log(`  [a] All skills\n`);

  const answer = await ask('  Select (numbers separated by spaces, or "a" for all): ');
  rl.close();

  if (!answer.trim()) {
    console.log('  Nothing selected.');
    return;
  }

  let selected;
  if (answer.trim().toLowerCase() === 'a') {
    selected = entries.map(([name]) => name);
  } else {
    const indices = answer.trim().split(/[\s,]+/).map(Number).filter(Boolean);
    selected = indices
      .filter((i) => i >= 1 && i <= entries.length)
      .map((i) => entries[i - 1][0]);
  }

  if (selected.length === 0) {
    console.log('  No valid selection.');
    return;
  }

  console.log('');
  await installSkills(selected, tools);
}

function helpText() {
  return `
  tainacan-skills — Agent skills for Tainacan development

  Usage:
    npx tainacan-skills                        Interactive installer
    npx tainacan-skills install                Install all skills
    npx tainacan-skills install <name>         Install specific skill(s)
    npx tainacan-skills list                   List available skills
    npx tainacan-skills help                   Show this help

  Skills are copied into the current directory. The default writes both
  destinations, which together cover the editors below.

    --tools=agents    .agents/skills/   Cursor, Codex, Gemini CLI, Antigravity, Copilot, OpenCode
    --tools=claude    .claude/skills/   Claude Code
    --tools=all       both (default)

  Cursor also reads .claude/skills/. Use --tools=agents when that second copy
  would list each skill twice.

  Available skills:
${Object.entries(SKILLS).map(([n, d]) => `    ${n.padEnd(22)} ${d}`).join('\n')}
`;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.exitCode = 1;
    return;
  }

  const { tools, positionals } = parsed;
  const command = positionals[0];

  if (!command) {
    await interactive(tools);
    return;
  }

  switch (command) {
    case 'list':
      await listSkills();
      break;

    case 'install': {
      const names = positionals.slice(1);
      await installSkills(names.length === 0 ? Object.keys(SKILLS) : names, tools);
      break;
    }

    case 'help':
    case '--help':
    case '-h':
      console.log(helpText());
      break;

    default:
      if (SKILLS[command]) {
        await installSkills([command], tools);
      } else {
        console.error(`  Unknown command: ${command}\n  Run "npx tainacan-skills help" for usage.`);
        process.exitCode = 1;
      }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
}).finally(() => {
  rl.close();
});
