---
name: api7-promo-video
description: >-
  Create or revise Apache APISIX, API7 and AISIX product videos at a requested
  duration: feature announcements, value explainers, full tutorials and demos.
  Deliver an MP4, cover, editable project, concise post and one matching CTA,
  with source-backed claims, official assets and visual review. Match a supplied
  reference's motion closely when requested. Use for these
  products' marketing, feature walkthroughs and demonstrations.
metadata:
  version: "1.3.0"
license: Apache-2.0
---

# APISIX / API7 promo video

Make one useful outcome visible, from a brief announcement to a complete topic
walkthrough. Deliver an editable film, not only a script or storyboard. Use the
user's language, scope and approval boundaries.

## Required duration, independent of video type

Every new video needs an explicit target duration before scripting, media
generation or rendering. Use a duration already supplied in this conversation;
otherwise ask: “How long should this video be? For example, 10 seconds, 30
seconds, or 3 minutes.” Do not silently reuse the 20-second sample's duration.
Honor an explicitly supplied range by stating a target within it. If the user
explicitly delegates length selection, choose and state a target before
production, and record that delegation. Safe source research may continue while
an otherwise missing duration is pending.

Infer the type from the requested result, or clarify when it is ambiguous:
`announcement`, `feature`, `tutorial` or `demo`. Type does not set the duration.
Record `videoType` and `duration` (seconds) in the brief. Read
[Video types and duration planning](references/formats.md) to choose scope,
chapter structure and proof. Suggested ranges are guidance, never hard limits.

## Read only what this job needs

| Need | Reference |
|---|---|
| Every new film: brief, style, aspect ratio and post | [Creative direction](references/creative.md) |
| Approved feed style: palette, Inter roles, card-sweep motion and copy hierarchy | [Approved feed style](references/approved-feed-style.md) |
| Explicitly requested close visual/motion reconstruction | [Reference fidelity](references/reference-fidelity.md) |
| Announcement, value explainer, tutorial or demo at the requested length | [Video types and duration planning](references/formats.md) |
| APISIX identity, feature evidence and CTA | [APISIX](references/apisix.md) |
| API7 identity, editions, product screens and CTA | [API7](references/api7.md) |
| Scaffold, edit, preview, render and resource checks | [Production](references/production.md) |
| Source verification, phone review and file acceptance | [Acceptance](references/acceptance.md) |

References are catalogued in [index.json](references/index.json). Third-party
asset provenance and licenses are in [the asset ledger](assets/ledger.json).

## Workflow

1. Extract product, audience, video type, topic, source links, language, explicit
   target duration, destination, narration/captions and CTA. Inspect provided material first. Ask
   only for missing information that changes the film. If a reference video
   cannot be watched, inspect an accessible existing browser tab first; state
   remaining limits and never claim frame-level analysis of unseen motion. For
   close reconstruction, request source media only when full playback remains
   unavailable.
2. Read creative direction and the selected brand reference. Use the approved
   feed profile for new authored promos unless the brief specifies another style;
   preserve real UI/code legibility in tutorials and demos. Choose the aspect
   ratio from the content and budget the chosen duration by scenes or chapters.
   Write the brief, storyboard and source mapping in an
   output directory outside this skill's source repository. Follow an approved
   storyboard directly; otherwise choose a concise direction when the user has
   requested a finished file. Do not introduce an unnecessary approval stop.
3. Use the production reference and bundled scaffold. The flow template is a
   starting point for short API traffic stories. Use authored scenes and real
   captures for announcements, longer explanations, tutorials and demos; do not
   stretch five short scenes to fill a longer target. Keep everything
   editable and all render assets local. No invented dashboard or benchmark.
4. Run checks, inspect every scene and transition at phone size, then render
   when the requested file and available resources authorize it. Repair
   demonstrated problems and rerun affected checks. A passing linter alone is
   not visual acceptance.
5. Deliver the MP4, cover, editable sources, 40–70-word post with one CTA, source
   and license records, and a concise review. Show the playable local film in
   the chat. Keep sample videos and generated projects out of the skill repo.
   Commit, push, open a PR, upload or post only within the user's current
   authorization; when approval is required, present the reviewed result first.

## Essential constraints

- One product, one subject and one final CTA per film by default. A full topic
  can have multiple chapters and verified steps. APISIX, API7 Gateway/Enterprise
  and AISIX are distinct products; use the correct product evidence.
- Use one Inter family (400/700) and shared role sizes across authored pages.
  Keep short announcement frames focused on the model/feature, useful support
  facts and exact setup inputs; move detailed caveats/accounting to technical
  notes. Do not compress those notes into an ambiguous slogan or CTA card.
- Use official marks without recolouring or stretching. A request-flow diagram
  must be labelled as illustrative, not presented as a live product capture.
- Source all technical claims to a version or commit. Separate observed output
  from an illustrative flow. Never promise traffic, savings or performance.
- Choose music from authorized, reusable sources; record attribution and edits.
  No paid media calls without the authorization required by the selected tool.
- Respect the host's disk/memory rules. Run one heavy task at a time. Do not
  delete caches, dependencies, history, source or outputs without permission.

Examples: “Use $api7-promo-video for a 10-second AISIX model-support
announcement, using this release note.” “Create a 3-minute APISIX rate-limiting
tutorial with English narration, captions and real configuration/result captures.”
