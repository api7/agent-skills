# AGENTS.md

Agent skills for API7 products, published on [skills.sh](https://skills.sh/api7/agent-skills).

## Layout

```
skills/
├── a6/                      # Apache APISIX, via the a6 CLI (https://github.com/api7/a6)
│   ├── SKILL.md             # router: frontmatter + routing table; keep under 300 lines
│   ├── LICENSE.txt
│   └── references/
│       ├── shared.md        # a6 CLI conventions — every other reference assumes it
│       ├── index.json       # machine-readable metadata for all references
│       ├── personas/*.md
│       ├── plugins/*.md
│       └── recipes/*.md
├── a7/                      # API7 Enterprise Edition, via the a7 CLI (https://github.com/api7/a7)
│   └── (same structure)
└── api7-promo-video/         # shared APISIX/API7 marketing capability
    ├── SKILL.md             # hand-written router; keep under 300 lines
    ├── LICENSE.txt
    ├── agents/openai.yaml   # agent-facing label and default prompt
    ├── references/          # indexed production and brand guidance
    ├── scripts/             # portable generation and validation tools
    └── assets/template/     # editable HyperFrames template, pinned dependencies
```

Each product has exactly **one operational** skill (`a6` or `a7`). Shared capabilities such as `api7-promo-video` are separate skills. The skills CLI discovers `skills/<name>/SKILL.md`, treats the whole directory as the skill, and shadows anything nested below it — so no nested directory may contain another `SKILL.md`.

## Rules

- `SKILL.md` is a router under 300 lines. The agent loads only its `description` at startup (max 1024 chars). Operational descriptions must list every covered plugin and workflow; shared capability descriptions must clearly state their trigger and outputs. Detailed guidance lives in `references/`, loaded on demand.
- Every reference file keeps a small frontmatter (`title`, `description`, `metadata.category`, `metadata.<cli>_commands`, …). Tooling reads it; agents ignore it.
- Adding an operational reference: create `references/<plugins|recipes|personas>/<name>.md`, add an entry to `references/index.json`, then run `node scripts/sync-router.mjs` — it regenerates the a6/a7 frontmatter descriptions and routing tables from index.json (never edit these tables by hand; CI runs `--check`). Finish with `node scripts/validate.mjs`.
- Shared capability references also need `path`, `title`, `description`, and `category` entries in `references/index.json` and a link from the router. Their routers are hand-written; `sync-router.mjs` intentionally processes only a6/a7.
- Video production uses HyperFrames 0.8.200 and portable paths. The automatic render resource gate currently supports macOS only; other hosts can run `npm run check`, but automatic rendering stops until a host-specific resource inspection is implemented. Do not add a bypass flag. Keep generated sample projects, renders, final media, and temporary asset downloads outside this repository. Only reusable skill instructions, templates, scripts, and licensed reusable assets belong here. Validate the skill and obtain the user's explicit agreement before submitting it to the company repository; local editing does not authorize a push or PR.
- `scripts/split-from-cli.mjs` was the one-time migration from the flat `skills/<cli>-<type>-<name>/SKILL.md` layout in the a6/a7 repositories. After the migration this repository is the source of truth; do not re-run it against the CLI repos unless you intend to overwrite local edits.
- Shell examples must only use commands and flags that exist in the current `a6` / `a7` CLI. The CLI repositories' `test/skills` Go test validates this; it is run against a checkout of this repository from their CI.

## Keeping the three repositories in sync

- **Content** lives only here. `api7/a6` and `api7/a7` contain no skill files; their `install.sh` and docs point at this repository.
- **Command validity** is decided by the CLIs. Their `test/skills` Go test checks every `a6 …` / `a7 …` invocation in `references/` against the real command tree. It runs in three places: on every a6/a7 PR (against this repo's `main`), on every PR here (`cli-examples` job, against the CLIs' default branches), and daily by schedule on both sides.
- **Order of changes**, so both CIs stay green:
  - *Adding* a command, flag, or plugin: merge the CLI PR first, then the reference PR here.
  - *Removing or renaming*: merge the reference PR here first (stop using the old command), then the CLI PR.
  - Prose-only edits: this repository only.
- Bump `version` in the affected `SKILL.md` for any content change; users pick it up with `npx skills update`.

## Validation

```bash
node scripts/validate.mjs
node scripts/sync-router.mjs --check
npx -y skills add . --list      # must report exactly 3 skills: a6, a7, api7-promo-video
```
