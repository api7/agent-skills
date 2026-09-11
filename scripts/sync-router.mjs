#!/usr/bin/env node
/**
 * Regenerate the generated parts of each skills/<cli>/SKILL.md from
 * references/index.json: the frontmatter `description` (must list every plugin
 * and workflow) and the three routing tables between the markers.
 *
 *   node scripts/sync-router.mjs           # rewrite SKILL.md files in place
 *   node scripts/sync-router.mjs --check   # exit 1 if any SKILL.md is stale (CI)
 *
 * Everything outside the markers (intro, operating rules, example) is hand-written.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { applyRouter, PRODUCTS } from './lib/router.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const check = process.argv.includes('--check');
let stale = 0;
for (const cli of readdirSync(join(ROOT, 'skills'))) {
  if (!PRODUCTS[cli]) continue;
  const dir = join(ROOT, 'skills', cli);
  const index = JSON.parse(readFileSync(join(dir, 'references', 'index.json'), 'utf8'));
  const file = join(dir, 'SKILL.md');
  const current = readFileSync(file, 'utf8');
  const next = applyRouter(cli, current, index.entries);
  if (next === current) { console.log(`${cli}: up to date`); continue; }
  stale++;
  if (check) console.error(`${cli}: SKILL.md is out of date with references/index.json — run node scripts/sync-router.mjs`);
  else { writeFileSync(file, next); console.log(`${cli}: SKILL.md updated`); }
}
process.exit(check && stale ? 1 : 0);
