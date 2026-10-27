#!/usr/bin/env node
/**
 * Repository validation (no dependencies). Run: node scripts/validate.mjs
 *
 *  1. Exactly the expected skills exist: skills/<name>/SKILL.md, name == dir.
 *  2. SKILL.md frontmatter: name (kebab-case, <=64), description (non-empty, <=1024).
 *  3. No SKILL.md anywhere under references/ (it would be shadowed by the CLI and
 *     re-exposed by `--full-depth`).
 *  4. Every relative markdown link inside skills/** resolves to a file.
 *  5. Every references/**\/*.md is linked from its SKILL.md and listed in index.json.
 *  6. Every reference file has a frontmatter with title + description.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED = ['a6', 'a7', 'api7-promo-video'];
const ROOT = fileURLToPath(new URL('..', import.meta.url));
let errors = 0;
const err = (m) => { errors++; console.error(`ERROR: ${m}`); };

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    e.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
const fm = (md) => (md.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
const scalar = (f, k) => (f.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
const folded = (f, k) => {
  const m = f.match(new RegExp(`^${k}:\\s*>-?\\n((?:[ \\t]+.*(?:\\n|$))+)`, 'm'));
  return m ? m[1].replace(/\s+/g, ' ').trim() : scalar(f, k);
};

const found = readdirSync(join(ROOT, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
if (JSON.stringify(found) !== JSON.stringify(EXPECTED)) err(`skills/ contains ${found.join(', ')}; expected exactly ${EXPECTED.join(', ')}`);

for (const name of found) {
  const dir = join(ROOT, 'skills', name);
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) { err(`${name}: missing SKILL.md`); continue; }
  const md = readFileSync(skillFile, 'utf8');
  const f = fm(md);
  const n = scalar(f, 'name');
  const d = folded(f, 'description') || '';
  if (n !== name) err(`${name}: frontmatter name "${n}" != directory`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) err(`${name}: invalid skill name`);
  if (!d) err(`${name}: empty description`);
  if (d.length > 1024) err(`${name}: description ${d.length} chars > 1024`);
  const lines = md.split('\n').length;
  if (lines >= 300) err(`${name}: SKILL.md has ${lines} lines (must be < 300)`);
  if (!existsSync(join(dir, 'LICENSE.txt'))) err(`${name}: missing LICENSE.txt`);

  const files = walk(dir);
  for (const p of files) if (p !== skillFile && p.endsWith('SKILL.md')) err(`${relative(ROOT, p)}: nested SKILL.md is not allowed`);

  const indexFile = join(dir, 'references', 'index.json');
  let index;
  try {
    index = JSON.parse(readFileSync(indexFile, 'utf8'));
    if (!Array.isArray(index.entries)) throw new Error('entries must be an array');
  } catch (e) { err(`${name}: invalid references/index.json (${e.message})`); continue; }
  const entries = index.entries.filter((e) => e && typeof e === 'object' && !Array.isArray(e));
  if (entries.length !== index.entries.length) err(`${name}: each index entry must be an object`);
  for (const e of entries) {
    for (const key of ['path', 'title', 'description', 'category']) {
      if (typeof e[key] !== 'string' || !e[key].trim()) err(`${name}: index entry needs ${key}`);
    }
    if (typeof e.path !== 'string' || !/^references\/(?!.*(?:^|\/)\.\.\/).+\.md$/.test(e.path)) err(`${name}: invalid reference path ${e.path}`);
  }
  const indexed = new Set(entries.map((e) => e.path));
  if (indexed.size !== entries.length) err(`${name}: duplicate reference paths in index.json`);
  const refs = files.filter((p) => p.includes('/references/') && p.endsWith('.md'));
  for (const p of refs) {
    const rel = relative(dir, p);
    if (!md.includes(`](${rel})`)) err(`${name}: ${rel} is not linked from SKILL.md`);
    if (!indexed.has(rel)) err(`${name}: ${rel} missing from references/index.json`);
    const rf = fm(readFileSync(p, 'utf8'));
    if (!scalar(rf, 'title') || !scalar(rf, 'description')) err(`${rel}: reference needs title + description frontmatter`);
  }
  for (const e of entries) if (typeof e.path === 'string' && !existsSync(join(dir, e.path))) err(`${name}: index.json entry ${e.path} does not exist`);

  if (name === 'api7-promo-video') {
    for (const required of ['agents/openai.yaml', 'assets/template', 'scripts']) {
      if (!existsSync(join(dir, required))) err(`${name}: missing ${required}`);
    }
  }

  for (const p of files.filter((x) => x.endsWith('.md'))) {
    const text = readFileSync(p, 'utf8');
    for (const m of text.matchAll(/\]\(([^)#\s]+)\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      if (!existsSync(join(dirname(p), t))) err(`${relative(ROOT, p)}: broken link ${t}`);
    }
  }
  console.log(`OK: ${name} — ${refs.length} references, description ${d.length} chars, SKILL.md ${lines} lines`);
}

if (errors) { console.error(`${errors} error(s)`); process.exit(1); }
console.log('All checks passed.');
