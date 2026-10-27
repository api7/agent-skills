---
title: Visual, technical and package acceptance
description: Check source-backed behavior, phone readability, transitions, audio, output properties and delivery boundaries.
metadata:
  category: review
---

# Acceptance

Run `npm run check` after the last composition edit; fix errors and assess
warnings. Then `npm run hf -- snapshot --review` and inspect beat, cut and phone
sheets. Inspect an eight-frame strip through the main action. Passing check with
zero visual samples is not a pass. Source review must match the final copy.

For requested close reconstruction, use the evidence and comparison protocol
in [Reference fidelity](reference-fidelity.md). Check the animation in motion
and at corresponding reference keyframes. Record matched properties and
remaining deviations; ordinary layout/contrast checks cannot prove resemblance.

For authored feed promos, also check [Approved feed style](approved-feed-style.md):
one rendered Inter family, four consistent role sizes, common field baselines,
balanced space after deletions, and no outgoing ghost text. Read every final
frame/post line for meaning, not just overflow. Setup pages should teach the
minimum needed inputs; explanatory restrictions belong in clearly separated
notes unless they qualify the advertised promise.

The brief must record the user's target duration and video type. Check that
the scene/step budget sums to that target; no silent length change or forced
five-scene structure. For longer films, review every chapter and actual cut,
not merely evenly spaced frames. A tutorial must show reproducible prerequisites,
actions and verification; a demo must distinguish actual capture from illustration.
An announcement must prove that the named model/feature is newly supported in
the stated version/edition rather than merely available in some other product.

- Frame 0 makes the subject clear; one headline and one visual action dominate.
- All beats connect. Diagram branches share a clear axis, labels are centered
  as blocks inside their nodes, and box gaps leave room for the connector and
  moving packets at 360px; verify these visually rather than accepting no overflow.
  Proof is visible long enough and readable text is not
  clipped, occluded or below 32 px at 1080 px short-side size.
- At 360 px width the title, important diagram labels and CTA are readable.
- Titles land and hold; request animation has meaningful paths. A rejected
  request cannot appear to reach the protected upstream.
- No flash or empty frame at scene boundaries; CTA holds at least 2 seconds.
  Inspect frames just before/after each cut.
- Official mark is correct and undistorted; an illustrative diagram is labelled.
  UI comes from the real product and has a source/version.
- Feature, edition, status code, counting key and local/cluster scope match the
  pinned source. No invented metric or claim of live verification.

Render to `renders/promo.mp4`; `npm run verify` checks a nonempty file, brief
duration, dimensions, 30 fps, H.264 video, AAC audio and loudness. Inspect decoded
frames from the MP4 as well as preview PNGs. Listen if playback is available;
otherwise state “audio measured, not heard.” Do not claim music quality from
numeric meters. Record track source, author, license and edits.

The render helper exports cover.png at full dimensions from the opening frame
and a 360 px decoded-frame contact sheet. Inspect them; export is not approval.

Deliver MP4, cover, editable project, PUBLISHING.md (40–70-word body, one CTA and
music credits), SOURCES.md, assets/ledger.json, and REVIEW.md. Review records
checks, fixes, deliberate warnings and limitations. Exclude node_modules/caches
from any delivery ZIP, preserve the original files/history and do not invent a
rating.

For a complex new/revised skill, run an independent forward test from a realistic
request in a separate output directory. Give the tester the skill, request and
raw permitted assets, not the intended answer or suspected bugs. Improve based
on actual results, then rerun affected checks. Independently review the final
diff and tests before a requested repository submission. If the user requires
approval, deliver the concrete result and wait before any commit/push/PR.
Generated media stays local unless explicitly requested otherwise.
