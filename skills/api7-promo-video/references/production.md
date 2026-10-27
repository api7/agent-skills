---
title: Editable production and local rendering
description: Scaffold from a brief, preserve deterministic HyperFrames scenes and render within machine resource limits.
metadata:
  category: production
---

# Production

Requires Node.js ≥22, FFmpeg/ffprobe and a Chromium browser supported by
HyperFrames. Projects pin **HyperFrames 0.8.200** in package.json and
package-lock.json. Use this pin for the template; an upgrade needs compatibility
testing. No paid account is required for local production. Read other relevant
HyperFrames skills if installed; this reference and the template also carry the
essential contract for installations without those skills.

## Start from a brief

First obtain the target duration, and record `videoType` and `duration` in
seconds. Copy [brief.example.json](../assets/template/brief.example.json) for a
short traffic-flow explainer; replace every creative field and supply local
authorized music with source/credit, or use authored scenes as described below.
Paths to media are relative to the brief, or absolute at generation time; the
scaffold copies media into the project's assets directory. Output must be a new
directory; the helper refuses to overwrite existing work.

```sh
node <skill-dir>/scripts/create.mjs --brief ./brief.json --out ../promo-output
cd ../promo-output
npm ci --no-audit --no-fund
npm run hf -- usage --json
npm run hf -- catalog --query "minimal title reveal" --json
npm run check
npm run hf -- snapshot --review
npm run hf -- preview --background
npm run hf -- preview --status
# After visual review and resource checks:
npm run render
```

`npm run hf --` forwards arguments to the locally installed, pinned CLI.
`PROMO_HYPERFRAMES_BIN` may select an existing CLI for testing, but its package
version must still be 0.8.200. `FFMPEG_BIN` and `FFPROBE_BIN` can select media
tools. No machine-specific paths are shipped in the project.

`create.mjs` accepts product `apisix`, `api7` or `aisix`, an explicit positive
duration aligned to 30 fps, and videoType `announcement`, `feature`, `tutorial`
or `demo`. There is no 15–45-second limit on authored films. The bundled traffic
starter remains available for 15–45-second APISIX/API7 `feature` briefs without
`scenes`; its five beats are a draft, not a general long-video template. AISIX
and other types/lengths require authored scenes. No type silently chooses a
duration. The output still contains the chosen `videoType` and `duration`.

## Authored scenes for short announcements, long films and captures

Add `scenes` to the brief. Each entry has a unique lowercase `id`, `duration`
(seconds), `file` (local HTML), `title` and `action`. The helper sequences these
scenes from zero; their durations must cover the target exactly. The last scene
reserves at least 2.6 seconds for CTA arrival/read time. There is no fixed scene
count; create chapters/steps using [Video types](formats.md), not repeated loops.

For example, a 180-second tutorial might allocate 12/18/40/40/35/30/5 seconds to
the outcome, prerequisites, configuration, execution, rejected-request proof,
scope summary and CTA. These numbers illustrate a budget, not mandatory cuts.
Each scene file uses the normal `<template>` contract below. Its root/timeline
id matches its entry; assets use project-root-relative paths. Tokens `{{STYLE}}`,
`{{WIDTH}}`, `{{HEIGHT}}`, `{{DURATION}}`, `{{TITLE}}` and the brand/copy tokens
are available. For authored scenes, {{STYLE}} inserts the reusable
[approved-feed CSS](../assets/approved-feed.css), with four Inter role tokens and
opt-in type/card/field classes. Compose the markup/timeline using
[Approved feed style](approved-feed-style.md); the injected CSS does not create
the motion. Real UI/code layouts may override it for the brief. The flow starter
continues to use its existing traffic-layout CSS. Author the actual steps and
media before calling the scaffold.

Common fields remain `copy.cta`, `ctaUrl`, `displayUrl`, `post`, `sources`,
`aspect`, `language` and `topic`. Other `copy` keys are optional with authored
scenes. Add real local captures, voice or caption assets using:

```json
{
  "videoType": "tutorial",
  "duration": 180,
  "scenes": [
    {"id":"intro","duration":12,"file":"./scenes/intro.html","title":"Control request traffic","action":"Show the task and promised result"}
  ],
  "media": [
    {"file":"./recordings/configuration.mp4","path":"assets/media/configuration.mp4","source":"User-authorized recording of the pinned demo environment","rights":"Recorded for this video; no private data"}
  ]
}
```

This is a partial schema example: supply the remaining scenes to total 180
seconds and all common fields. Media paths must be unique under `assets/media/`;
the helper copies the files and records hashes/rights. It never invents a real
screen recording. Keep narration/captions editable in the authored scene or
root; synchronize them to actual audio. `sound` can record the requested mix.

Use the existing `music` object for an authorized bed. With no separate music,
set `music: null` and `audioExpected: true` for embedded narration/capture audio,
or `audioExpected: false` for a deliberately silent film. Authored HTML declares
its actual audio once, with ids; do not mix an embedded master and duplicate
stems. Verification expects AAC when audio is requested, and no audio for an
explicitly silent film. Scaffold creation does not prove capture or sound quality.

The generated project contains index.html, compositions/, assets/, content.json,
SPEC.md, STORYBOARD.md, SOURCES.md, PUBLISHING.md and production helpers.
After review add REVIEW.md and run verification. Keep the film/project outside
the skill source repository. Never store credentials in briefs or sources.

## Render contract

- Root declares dimensions and duration. Each timed host has a stable id,
  `class="clip"`, `data-start`, `data-duration`, and graphics track kind.
- Each scene has all styles, markup and script inside `<template>`, styles its
  root as `#root`, and registers one paused timeline in
  `window.__timelines[compositionId]` after adding its tweens.
- Host, scene composition id and timeline key match. Root does not nest scene
  timelines; HyperFrames seeks each independently.
- Use local assets, `fromTo` and absolute timeline positions. No time-dependent
  randomness, timers, network fetches, transform conflicts or infinite loops.
  Animate children rather than visibility/display/transforms on timed clips.
- Time audio once; every `<audio>` has an id. Let HyperFrames drive media.
- Copy/colors use declared variables; fonts and vendor runtime are bundled with
  their licenses. Recompose at a new ratio instead of scaling a finished film.

## Resources and failure behavior

Before heavy work check disk free space and memory pressure; inspect for other
heavy builds/renders. Follow the host's AGENTS.md. On a 16 GB Mac the helper uses
a 3072 MB Node heap, one render worker and low-memory mode. It requires ≥45 GB
free disk for rendering, warns below 60 GB, and stops on memory pressure or
another heavy process. Unknown process inspection is a blocker, not proof the
machine is idle. Unsupported hosts require a separate host resource check, not
disabling the gate.

If memory runs out, stop and report it. Do not run parallel retries or increase
the heap automatically. If space is insufficient, complete lightweight work,
list concrete safe cleanup candidates and wait for explicit cleanup permission.
Never clean source, .git, uncommitted work, browser profiles, task history or
final media as cache. After heavy work report rebuild-directory sizes and unused
Docker data when queryable; do not start Docker merely to measure it.

Open the local preview before delivery render and tell the user the project is
editable there. A request for a finished file authorizes rendering once checks
pass; it does not authorize social publication or repository submission.
