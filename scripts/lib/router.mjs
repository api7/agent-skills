// Shared rendering for the SKILL.md router: the frontmatter description and the
// three routing tables are derived from references/index.json so humans only
// maintain index.json and the reference files. Used by split-from-cli.mjs
// (one-time migration) and sync-router.mjs (ongoing).

export const PRODUCTS = {
  a6: { name: 'Apache APISIX', short: 'APISIX', audience: 'the open-source Apache APISIX gateway', versionKey: 'apisix_version' },
  a7: { name: 'API7 Enterprise Edition', short: 'API7 EE', audience: 'API7 Enterprise Edition (API7 Gateway)', versionKey: 'apisix_version' },
};

export const TABLE_START = '<!-- routing-tables:start (generated from references/index.json by scripts/sync-router.mjs; do not edit by hand) -->';
export const TABLE_END = '<!-- routing-tables:end -->';

export function renderDescription(cli, entries) {
  const p = PRODUCTS[cli];
  const plugins = entries.filter((e) => e.category === 'plugin').map((e) => e.id).join(', ');
  const recipes = entries.filter((e) => e.category === 'recipe').map((e) => e.id).join(', ');
  const d =
    `Configure and operate ${p.audience} through the ${cli} CLI. Use whenever the user wants to ` +
    `create, inspect, change, or delete ${p.short} routes, services, upstreams, consumers, credentials, SSL certificates, ` +
    `global rules, or plugins (${plugins}), or run a workflow such as ${recipes}. ` +
    `Includes developer and platform-operator personas and the ${cli} command conventions.`;
  if (d.length > 1024) throw new Error(`${cli}: description is ${d.length} chars (> 1024)`);
  return d;
}

export const foldDescription = (d) => d.match(/.{1,96}(\s|$)/g).map((l) => l.trim()).join('\n  ');

const short = (d, n = 110) => (d.length > n ? d.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : d);

function stripPrefix(cli, d) {
  const p = PRODUCTS[cli];
  const prod = p.name.replace(/[()]/g, '\\$&');
  d = d
    .replace(new RegExp(`^(Skill|Recipe skill|Persona skill|Core skill) for (configuring|implementing|working with|setting up|managing)?\\s*(the )?(${prod}|Apache APISIX|APISIX|API7 Enterprise Edition \\(API7 EE\\)|API7 EE)?\\s*`, 'i'), '')
    .replace(new RegExp(`\\s*(via|using|with) the ${cli} CLI[^.]*\\.\\s*`, 'i'), '. ')
    .replace(/^\s*(plugin|recipe|persona)?\s*/i, '')
    .replace(/^\w/, (c) => c.toUpperCase());
  d = d.replace(new RegExp(`\\s*(using|on|with|for) (the )?(${prod}( \\(API7 EE\\))?|Apache APISIX|APISIX|API7 EE)( and the ${cli} CLI)?`, 'g'), '');
  d = d.replace(/^[^.]{0,60}?\b(plugin|recipe|persona|releases?|workflows?|strategies|patterns)\.\s*/i, '');
  return short(d.replace(/^\w/, (c) => c.toUpperCase()));
}

const row = (cli, e) => `| \`${e.category === 'plugin' ? (e.plugin_name || e.id) : e.id}\` | [${e.path.replace('references/', '')}](${e.path}) | ${stripPrefix(cli, e.description)} |`;

export function renderTables(cli, entries) {
  const plugins = entries.filter((e) => e.category === 'plugin');
  const recipes = entries.filter((e) => e.category === 'recipe');
  const personas = entries.filter((e) => e.category === 'persona');
  return `${TABLE_START}

### Plugins (${plugins.length})

| Plugin | Reference | Covers |
|---|---|---|
${plugins.map((e) => row(cli, e)).join('\n')}

### Recipes — multi-step workflows (${recipes.length})

| Workflow | Reference | Covers |
|---|---|---|
${recipes.map((e) => row(cli, e)).join('\n')}

### Personas — role-based guidance (${personas.length})

| Role | Reference | Covers |
|---|---|---|
${personas.map((e) => row(cli, e)).join('\n')}

${TABLE_END}`;
}

/** Apply description + tables to an existing SKILL.md; returns the new text. */
export function applyRouter(cli, skillMd, entries) {
  const desc = foldDescription(renderDescription(cli, entries));
  let out = skillMd.replace(/^description: >-\n(?:  .*\n)+/m, `description: >-\n  ${desc}\n`);
  const start = out.indexOf(TABLE_START);
  const end = out.indexOf(TABLE_END);
  if (start === -1 || end === -1) throw new Error(`${cli}: SKILL.md is missing the routing-tables markers`);
  out = out.slice(0, start) + renderTables(cli, entries) + out.slice(end + TABLE_END.length);
  return out;
}
