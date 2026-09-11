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
└── a7/                      # API7 Enterprise Edition, via the a7 CLI (https://github.com/api7/a7)
    └── (same structure)
```

Each product is exactly **one** skill. The skills CLI discovers `skills/<name>/SKILL.md`, treats the whole directory as the skill, and shadows anything nested below it — so `references/` must never contain a file named `SKILL.md`.

## Rules

- `SKILL.md` is a router. The agent loads only its `description` at startup, so the description must list every plugin and workflow name the skill covers (max 1024 chars). Detailed guidance lives in `references/`, loaded on demand.
- Every reference file keeps a small frontmatter (`title`, `description`, `metadata.category`, `metadata.<cli>_commands`, …). Tooling reads it; agents ignore it.
- Adding a reference: create `references/<plugins|recipes|personas>/<name>.md`, add a row to the routing table in `SKILL.md`, add an entry to `references/index.json`, run `node scripts/validate.mjs`.
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
npx -y skills add . --list      # must report exactly 2 skills: a6, a7
```
