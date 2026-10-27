# API7 Agent Skills

[![skills.sh](https://skills.sh/b/api7/agent-skills)](https://skills.sh/api7/agent-skills)

Agent skills that teach AI coding agents — Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, OpenCode and [70+ others](https://github.com/vercel-labs/skills#supported-agents) — how to operate API7 gateways and create focused product videos from natural language.

| Skill | Product | Tools | Contents |
|---|---|---|---|
| [`a6`](skills/a6/SKILL.md) | [Apache APISIX](https://apisix.apache.org) | [`a6`](https://github.com/api7/a6) | 29 plugins · 8 operational recipes · 2 personas · CLI conventions |
| [`a7`](skills/a7/SKILL.md) | [API7 Enterprise Edition](https://api7.ai/enterprise) | [`a7`](https://github.com/api7/a7) | 29 plugins · 8 operational recipes · 2 personas · CLI conventions |
| [`api7-promo-video`](skills/api7-promo-video/SKILL.md) | Apache APISIX / API7 / AISIX | HyperFrames 0.8.200 · FFmpeg | Announcements · feature explainers · tutorials · demos · cover · editable project · copy and CTA |

## Install

```bash
# pick the skills you need interactively
npx skills add api7/agent-skills

# or install one directly, for a specific agent
npx skills add api7/agent-skills --skill a6 -a claude-code
npx skills add api7/agent-skills --skill a7 -a cursor
npx skills add api7/agent-skills --skill api7-promo-video -a codex
```

`-g` installs globally instead of into the current project. Update later with `npx skills update`.

Installing copies instructions and skill assets. It does not install a CLI, connect to a gateway, or run any command. For the operational skills, you still need:

- the CLI on your `PATH` — `go install github.com/api7/a6/cmd/a6@latest` or `go install github.com/api7/a7/cmd/a7@latest`
- a reachable gateway: the APISIX Admin API for `a6`, or an API7 EE control plane plus a gateway group and access token for `a7`

Then ask your agent in plain language:

> Add key-auth to my `/orders` route and rate-limit it to 100 requests per minute.

For the video skill, ask:

> Create a 20-second square APISIX feature explainer about request rate limiting, with short English copy and a documentation CTA.

Or ask for a 10-second model-support announcement, a 3-minute rate-limiting
tutorial, or a 90-second workflow demo. Supply the target length each time;
the skill asks when it is missing. Type and duration are separate inputs.

The video workflow uses a portable HyperFrames template, verified product sources, official brand assets, and explicit asset licensing. It produces local deliverables; publishing a video or submitting repository changes requires the user's authorization. Generated projects, renders, and final media belong outside this repository. See the [video skill](skills/api7-promo-video/SKILL.md) for tool setup and validation.

The automatic rendering resource gate currently supports macOS. Other hosts can run `npm run check`; automatic rendering stops until a host-specific resource inspection is implemented. There is no bypass flag.

## How a skill is organised

Each product has one operational skill so that your agent sees one entry, not forty. The shared `api7-promo-video` skill covers the separate marketing capability across products. `SKILL.md` is a short router whose body maps the user's request to references read only when needed. The operational routers list every covered plugin and workflow in their generated descriptions.

```
skills/a6/
├── SKILL.md                      # router + operating rules
└── references/
    ├── shared.md                 # a6 command conventions — read first
    ├── plugins/key-auth.md …     # one file per plugin
    ├── recipes/canary.md …       # multi-step workflows with verification and rollback
    └── personas/operator.md …    # role-based guidance
```

Operational references follow the same discipline: inspect the current configuration, propose an exact change, wait for approval, apply, verify, keep a rollback path, and never place a token or Admin API key in a prompt or a file. Video references instead cover briefs, branding, production, rights, and delivery checks; they do not operate a live gateway.

## Development

```bash
node scripts/validate.mjs        # structure, frontmatter, links, index
node scripts/sync-router.mjs --check # generated a6/a7 routers only
npx -y skills add . --list       # must find exactly a6, a7, api7-promo-video
```

See [AGENTS.md](AGENTS.md) for the layout rules and how to add a reference.

## License

Apache-2.0. See [LICENSE](LICENSE).
