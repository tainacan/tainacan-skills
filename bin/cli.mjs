#!/usr/bin/env node

import { readdir, cp, mkdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, '..', 'skills');
const TARGET_DIR = resolve(process.cwd(), '.claude', 'skills');

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

async function installSkills(names) {
  await mkdir(TARGET_DIR, { recursive: true });

  for (const name of names) {
    const src = join(SKILLS_DIR, name);
    const dst = join(TARGET_DIR, name);

    if (!await exists(src)) {
      console.error(`  ✗ Skill "${name}" not found`);
      continue;
    }

    await cp(src, dst, { recursive: true, force: true });
    console.log(`  ✓ ${name} → .claude/skills/${name}/`);
  }

  console.log('\nDone. Skills are ready in .claude/skills/');
}

async function interactive() {
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
  await installSkills(selected);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    await interactive();
    return;
  }

  switch (command) {
    case 'list':
      await listSkills();
      break;

    case 'install': {
      const names = args.slice(1);
      if (names.length === 0) {
        await installSkills(Object.keys(SKILLS));
      } else {
        await installSkills(names);
      }
      break;
    }

    case 'help':
    case '--help':
    case '-h':
      console.log(`
  tainacan-skills — Agent skills for Tainacan development

  Usage:
    npx tainacan-skills                Interactive installer
    npx tainacan-skills install        Install all skills
    npx tainacan-skills install <name> Install specific skill(s)
    npx tainacan-skills list           List available skills
    npx tainacan-skills help           Show this help

  Skills are copied to .claude/skills/ in the current directory.

  Available skills:
${Object.entries(SKILLS).map(([n, d]) => `    ${n.padEnd(22)} ${d}`).join('\n')}
`);
      break;

    default:
      if (SKILLS[command]) {
        await installSkills([command]);
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
