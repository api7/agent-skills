# API7 Agent Skills

[![skills.sh](https://skills.sh/b/api7/agent-skills)](https://skills.sh/api7/agent-skills)

Agent skills that teach AI coding agents — Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, OpenCode and [70+ others](https://github.com/vercel-labs/skills#supported-agents) — how to configure and operate API7 gateways from natural language.

| Skill | Product | CLI | Contents |
|---|---|---|---|
| [`a6`](skills/a6/SKILL.md) | [Apache APISIX](https://apisix.apache.org) | [`a6`](https://github.com/api7/a6) | 29 plugins · 8 operational recipes · 2 personas · CLI conventions |
| [`a7`](skills/a7/SKILL.md) | [API7 Enterprise Edition](https://api7.ai/enterprise) | [`a7`](https://github.com/api7/a7) | 29 plugins · 8 operational recipes · 2 personas · CLI conventions |

## Install

```bash
# pick a6 and/or a7 interactively
npx skills add api7/agent-skills

# or install one directly, for a specific agent
npx skills add api7/agent-skills --skill a6 -a claude-code
npx skills add api7/agent-skills --skill a7 -a cursor
```

`-g` installs globally instead of into the current project. Update later with `npx skills update`.

Installing copies instructions only. It does not install the CLI, connect to a gateway, or run any command. You still need:

- the CLI on your `PATH` — `go install github.com/api7/a6/cmd/a6@latest` or `go install github.com/api7/a7/cmd/a7@latest`
- a reachable gateway: the APISIX Admin API for `a6`, or an API7 EE control plane plus a gateway group and access token for `a7`

Then ask your agent in plain language:

> Add key-auth to my `/orders` route and rate-limit it to 100 requests per minute.

## How a skill is organised

Each product is a single skill so that your agent sees one entry, not forty. `SKILL.md` is a short router: its description lists every plugin and workflow the skill covers, and its body maps the user's request to one reference file that is read only when needed.

```
skills/a6/
├── SKILL.md                      # router + operating rules
└── references/
    ├── shared.md                 # a6 command conventions — read first
    ├── plugins/key-auth.md …     # one file per plugin
    ├── recipes/canary.md …       # multi-step workflows with verification and rollback
    └── personas/operator.md …    # role-based guidance
```

Every reference follows the same discipline: inspect the current configuration, propose an exact change, wait for approval, apply, verify, keep a rollback path, and never place a token or Admin API key in a prompt or a file.

## Development

```bash
node scripts/validate.mjs        # structure, frontmatter, links, index
npx -y skills add . --list       # must find exactly a6 and a7
```

See [AGENTS.md](AGENTS.md) for the layout rules and how to add a reference.

## License

Apache-2.0. See [LICENSE](LICENSE).
