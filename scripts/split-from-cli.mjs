#!/usr/bin/env node
/**
 * One-time migration: turn a CLI repo's flat `skills/<cli>-<type>-<name>/SKILL.md`
 * collection into one umbrella skill:
 *
 *   skills/<cli>/SKILL.md                 router (frontmatter + routing table)
 *   skills/<cli>/references/shared.md     CLI conventions (was <cli>-shared)
 *   skills/<cli>/references/personas/*.md
 *   skills/<cli>/references/plugins/*.md
 *   skills/<cli>/references/recipes/*.md
 *   skills/<cli>/references/index.json    machine-readable metadata
 *
 * Usage: node scripts/split-from-cli.mjs <cli> <path-to-cli-repo> [out-root]
 *   node scripts/split-from-cli.mjs a6 ../a6
 *   node scripts/split-from-cli.mjs a7 ../a7
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [cli, cliRepo, outRootArg] = process.argv.slice(2);
if (!cli || !cliRepo) {
  console.error('usage: split-from-cli.mjs <cli> <cli-repo-path> [out-root]');
  process.exit(2);
}
const ROOT = outRootArg ? resolve(outRootArg) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(cliRepo, 'skills');
const OUT = join(ROOT, 'skills', cli);
const REF = join(OUT, 'references');

const PRODUCT = {
  a6: {
    name: 'Apache APISIX',
    short: 'APISIX',
    repo: 'https://github.com/api7/a6',
    ref: 'main',
    author: 'Apache APISIX Contributors',
    versionKey: 'apisix_version',
    versionLabel: 'APISIX',
    audience: 'the open-source Apache APISIX gateway',
    api: 'the APISIX Admin API',
    scope: '',
  },
  a7: {
    name: 'API7 Enterprise Edition',
    short: 'API7 EE',
    repo: 'https://github.com/api7/a7',
    ref: 'master',
    author: 'API7.ai Contributors',
    versionKey: 'apisix_version',
    versionLabel: 'API7 EE',
    audience: 'API7 Enterprise Edition (API7 Gateway)',
    api: 'the API7 EE control-plane API and the Admin API of a gateway group',
    scope: ' Every runtime resource is scoped to a gateway group (`--gateway-group` / `-g`).',
  },
}[cli];
if (!PRODUCT) { console.error(`unknown cli ${cli}`); process.exit(2); }

// ---------- tiny frontmatter reader (matches what the docs generator used) ----------
function splitFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? { fm: m[1], body: md.slice(m[0].length) } : { fm: '', body: md };
}
const scalar = (fm, key) => {
  const m = fm.match(new RegExp(`^\\s*${key}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm'));
  return m ? m[1].trim() : undefined;
};
function folded(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*>-?\\n([\\s\\S]*?)\\n(?=\\S)`, 'm'));
  if (!m) return scalar(fm, key) || '';
  return m[1].replace(/\s+/g, ' ').trim();
}
function list(fm, key) {
  const idx = fm.indexOf(`${key}:`);
  if (idx === -1) return [];
  const items = [];
  for (const line of fm.slice(idx + key.length + 1).split('\n')) {
    const m = line.match(/^\s+-\s+(.+?)\s*$/);
    if (m) items.push(m[1]);
    else if (line.trim() && !line.startsWith(' ')) break;
  }
  return items;
}
const yq = (s) => JSON.stringify(String(s));

// ---------- read the flat collection ----------
const dirs = readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const skills = [];
for (const dir of dirs) {
  const file = join(SRC, dir, 'SKILL.md');
  if (!existsSync(file)) continue;
  const { fm, body } = splitFrontmatter(readFileSync(file, 'utf8'));
  const name = scalar(fm, 'name') || dir;
  const category = scalar(fm, 'category') || (name.endsWith('-shared') ? 'shared' : 'plugin');
  const tail = name.replace(new RegExp(`^${cli}-(plugin|recipe|persona)-`), '');
  skills.push({
    id: name,
    category,
    slug: category === 'shared' ? 'shared' : tail,
    description: folded(fm, 'description'),
    version: scalar(fm, 'version') || '1.0.0',
    pluginName: scalar(fm, 'plugin_name'),
    minVersion: scalar(fm, PRODUCT.versionKey) || '',
    commands: list(fm, `${cli}_commands`),
    body,
  });
}
if (skills.length === 0) { console.error(`no skills found under ${SRC}`); process.exit(1); }

const relPath = (s) => (s.category === 'shared' ? 'references/shared.md' : `references/${s.category}s/${s.slug}.md`);
const title = (s) =>
  s.category === 'plugin' ? `${s.slug} plugin`
  : s.category === 'recipe' ? `${s.slug.replace(/-/g, ' ')} recipe`
  : s.category === 'persona' ? `${s.slug} persona`
  : `${cli} CLI conventions`;

// ---------- body transforms ----------
const byId = new Map(skills.map((s) => [s.id, s]));
function transformBody(s) {
  let b = s.body.replace(/^\s+/, '');
  // H1 `# a6-plugin-cors` -> friendly title
  b = b.replace(/^# .*\n/, `# ${title(s)}\n`);
  // Cross-references to sibling skills -> relative links into references/
  b = b.replace(new RegExp('`(' + cli + '-(?:plugin|recipe|persona)-[a-z0-9-]+|' + cli + '-shared)`', 'g'), (m, id) => {
    const t = byId.get(id);
    if (!t || t === s) return m;
    const from = dirname(relPath(s));
    const to = relPath(t);
    let rel = to.startsWith(from + '/') ? to.slice(from.length + 1) : '../' + to.replace(/^references\//, '');
    if (from === 'references') rel = to.replace(/^references\//, '');
    return `[\`${t.slug}\`](${rel})`;
  });
  // Bare mentions like "a6-plugin-key-auth skill" (no backticks)
  b = b.replace(new RegExp('\\b' + cli + '-(plugin|recipe|persona)-([a-z0-9-]+)\\b(?![\\]`])', 'g'), (m, type, slug) =>
    byId.has(`${cli}-${type}-${slug}`) ? `${slug} ${type}` : m);
  // The CLI repo tree no longer contains skills/
  b = b.replace(/^│?\s*[├└]── skills\/.*\n/m, '');
  return b.replace(/\s+$/, '') + '\n';
}

// ---------- write references ----------
rmSync(OUT, { recursive: true, force: true });
for (const sub of ['personas', 'plugins', 'recipes']) mkdirSync(join(REF, sub), { recursive: true });

const noteLine = `> Part of the \`${cli}\` skill for ${PRODUCT.name}. Read [${cli} CLI conventions](${'../'.repeat(0)}shared.md) first if you have not already.\n`;
for (const s of skills) {
  const meta = [
    '---',
    `title: ${yq(title(s))}`,
    `description: ${yq(s.description)}`,
    'metadata:',
    `  category: ${s.category}`,
    s.pluginName ? `  plugin_name: ${s.pluginName}` : null,
    s.minVersion ? `  ${PRODUCT.versionKey}: ${yq(s.minVersion)}` : null,
    s.commands.length ? `  ${cli}_commands:` : null,
    ...s.commands.map((c) => `    - ${c}`),
    `  source: ${PRODUCT.repo}/blob/${PRODUCT.ref}/skills/${s.id}/SKILL.md`,
    '---',
    '',
  ].filter((x) => x !== null).join('\n');
  const body = transformBody(s);
  const note = s.category === 'shared' ? '' : noteLine.replace('shared.md', s.category === 'shared' ? 'shared.md' : '../shared.md') + '\n';
  const h1End = body.indexOf('\n') + 1;
  writeFileSync(join(OUT, relPath(s)), meta + body.slice(0, h1End) + '\n' + note + body.slice(h1End).replace(/^\n+/, ''));
}

// ---------- index.json ----------
const index = skills.map((s) => ({
  id: s.slug, category: s.category, title: title(s), path: relPath(s), description: s.description,
  plugin_name: s.pluginName || null, [PRODUCT.versionKey]: s.minVersion || null,
  commands: s.commands, legacy_name: s.id, source: `${PRODUCT.repo}/blob/${PRODUCT.ref}/skills/${s.id}/SKILL.md`,
}));
writeFileSync(join(REF, 'index.json'), JSON.stringify({ skill: cli, product: PRODUCT.name, generated_from: PRODUCT.repo, entries: index }, null, 2) + '\n');

// ---------- SKILL.md (router) ----------
const plugins = skills.filter((s) => s.category === 'plugin');
const recipes = skills.filter((s) => s.category === 'recipe');
const personas = skills.filter((s) => s.category === 'persona');
const shared = skills.find((s) => s.category === 'shared');
const pluginList = plugins.map((s) => s.slug).join(', ');
const recipeList = recipes.map((s) => s.slug).join(', ');

const description =
  `Configure and operate ${PRODUCT.audience} through the ${cli} CLI. Use whenever the user wants to ` +
  `create, inspect, change, or delete ${PRODUCT.short} routes, services, upstreams, consumers, credentials, SSL certificates, ` +
  `global rules, or plugins (${pluginList}), or run a workflow such as ${recipeList}. ` +
  `Includes developer and platform-operator personas and the ${cli} command conventions.`;
if (description.length > 1024) throw new Error(`description too long: ${description.length}`);

const short = (d, n = 110) => (d.length > n ? d.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : d);
const stripPrefix = (d) => d
  .replace(new RegExp(`^(Skill|Recipe skill|Persona skill|Core skill) for (configuring|implementing|working with|setting up|managing)?\\s*(the )?(${PRODUCT.name.replace(/[()]/g, '\\$&')}|Apache APISIX|APISIX|API7 Enterprise Edition \\(API7 EE\\)|API7 EE)?\\s*`, 'i'), '')
  .replace(new RegExp(`\\s*(via|using|with) the ${cli} CLI[^.]*\\.\\s*`, 'i'), '. ')
  .replace(/^\s*(plugin|recipe|persona)?\s*/i, '')
  .replace(/^\w/, (c) => c.toUpperCase());
const covers = (s) => {
  let d = stripPrefix(s.description);
  d = d.replace(new RegExp(`\\s*(using|on|with|for) (the )?(${PRODUCT.name.replace(/[()]/g, '\\$&')}( \\(API7 EE\\))?|Apache APISIX|APISIX|API7 EE)( and the ${cli} CLI)?`, 'g'), '');
  d = d.replace(/^[^.]{0,60}?\b(plugin|recipe|persona|releases?|workflows?|strategies|patterns)\.\s*/i, '');
  d = d.replace(/^(Covers|Provides|Includes)\s+/i, (m) => m);
  return short(d.replace(/^\w/, (c) => c.toUpperCase()));
};
const row = (s) => `| \`${s.category === 'plugin' ? (s.pluginName || s.slug) : s.slug}\` | [${relPath(s).replace('references/', '')}](${relPath(s)}) | ${covers(s)} |`;

const skillMd = `---
name: ${cli}
description: >-
  ${description.match(/.{1,96}(\s|$)/g).map((l) => l.trim()).join('\n  ')}
version: "2.0.0"
license: Apache-2.0
metadata:
  author: ${PRODUCT.author}
  cli: ${cli}
  cli_repo: ${PRODUCT.repo}
  product: ${PRODUCT.name}
  ${PRODUCT.versionKey}: ">=3.0.0"
  references: ${skills.length}
---

# ${cli} — ${PRODUCT.name} agent skill

\`${cli}\` is the command-line tool for ${PRODUCT.name}. It wraps ${PRODUCT.api}.${PRODUCT.scope}
This skill is a router: it tells you which reference file to read for the task at hand. Read only what the task needs.

## 1. Always start here

Read [references/shared.md](references/shared.md) once per session before running any \`${cli}\` command. It covers the noun-verb command pattern, output formats, context/authentication handling, resource types, and the declarative \`${cli} config sync\` workflow. Every other reference assumes it.

## 2. Pick the reference for the task

Match the user's request against the tables below and read the linked file. Load one plugin or recipe file at a time; add a second only when the task clearly spans both (for example key-auth + limit-count).

### Plugins (${plugins.length})

| Plugin | Reference | Covers |
|---|---|---|
${plugins.map(row).join('\n')}

### Recipes — multi-step workflows (${recipes.length})

| Workflow | Reference | Covers |
|---|---|---|
${recipes.map(row).join('\n')}

### Personas — role-based guidance (${personas.length})

| Role | Reference | Covers |
|---|---|---|
${personas.map(row).join('\n')}

If nothing matches, the request is probably plain resource CRUD (routes, services, upstreams, consumers, SSL, global rules): [references/shared.md](references/shared.md) is sufficient. Machine-readable metadata for every reference is in [references/index.json](references/index.json).

## 3. Operating rules

1. **Inspect before you change.** List or get the current resource (\`${cli} route get <id>\`, \`${cli} route list\`) and show the user what exists.
2. **Propose an exact change and wait for approval** before applying anything to a gateway. Prefer file-based commands (\`-f route.yaml\` / \`-f -\`) so the full payload is visible.
3. **Apply only the approved change**, scoped as narrowly as possible${cli === 'a7' ? ' (always pass `--gateway-group`)' : ''}.
4. **Verify** with a follow-up \`get\` and, where possible, a test request through the gateway.
5. **Keep a rollback path**: note the previous configuration before updating, and use \`${cli} config dump\` / \`${cli} config diff\` for larger changes.
6. **Never put an access token or Admin API key in a prompt, file, or commit.** Use \`${cli} context\` for credentials.
7. **Use a non-production ${cli === 'a7' ? 'gateway group' : 'instance'} for a first run** of any new workflow.

## 4. Example — combine two references

User: *"Add key-auth to my \`/orders\` route and rate-limit it to 100 requests per minute."*

1. Read \`references/shared.md\`, then \`references/plugins/key-auth.md\` and \`references/plugins/limit-count.md\`.
2. Inspect: \`${cli} route get orders${cli === 'a7' ? ' -g default' : ''}\`.
3. Propose the merged plugin block, get approval, apply with \`${cli} route update orders${cli === 'a7' ? ' -g default' : ''} -f route.yaml\`, then verify with \`${cli} route get orders${cli === 'a7' ? ' -g default' : ''}\`.
`;
writeFileSync(join(OUT, 'SKILL.md'), skillMd);
writeFileSync(join(OUT, 'LICENSE.txt'), readFileSync(resolve(cliRepo, 'LICENSE'), 'utf8'));

console.log(`${cli}: wrote SKILL.md (${skillMd.split('\n').length} lines, description ${description.length} chars) + ${skills.length} references to ${OUT}`);
