---
title: Close visual and motion reconstruction
description: Reconstruct an inspectable reference's timing, typography, composition and motion when the user explicitly requests high fidelity.
metadata:
  category: production
---

# Reference fidelity

Use this mode for explicit requests such as “maximum fidelity”, “same animation”
or “最大化还原”. Ordinary “inspired by LiteLLM” briefs remain creative-direction
work. Record the selected mode in SPEC.md. Use authored scenes; no special CLI
flag is implied.

## Establish an observable source

Watch the complete reference and inspect its actual frames before choosing
motion. Record its URL or local path, observation method, duration, dimensions,
frame rate when known, and local-file hash in REFERENCE.md. Keep reference media
and analysis outside the skill repository.

A caption, thumbnail, static screenshot or a blocked player cannot establish
animation timing. A block in one browser does not prove that an already-open
user browser tab is inaccessible: inspect the available tab through authorized
browser tools before asking for a file. Do not bypass security challenges.
If complete playback remains unavailable, request the original
video or a full screen recording. Unknown properties stay unknown. Diagnose the
current film and prepare the comparison brief while waiting; do not replace
unseen motion with generic fades and call it a reconstruction. If only a remote
player is inspectable, record that limit and the frames actually observed.

## Measure before choosing effects

Make a timecoded shot/motion sheet covering every reference scene and transition:

| Property | What to record |
|---|---|
| Composition | Normalized positions and bounds, alignment, empty space, layer order, background and accent colors |
| Typography | Typeface or identified fallback, size relative to canvas, weight, tracking, line breaks, masks |
| Each moving object | Start, intermediate and final position/scale/opacity/rotation; anchor and clipping boundary |
| Timing | Entrance, exit, stagger and hold times; overlaps; cut points; loop seam if present |
| Motion character | Acceleration/deceleration, overshoot, settling, blur or trail if observed; fit an easing curve from sampled positions |
| Continuity | Which object persists, changes role or becomes the next scene; camera/pan/zoom when present |

Inspect a frame before motion, multiple frames during it, its landing and its
hold. Use dense samples around short transitions rather than only evenly spaced
scene midpoints. Distinguish measurements, estimates and intentional adaptations.
Do not infer a particular easing, kinetic-text effect or transition merely from
the publisher's name.

## Reconstruct the measured design

Treat observed layout, typography, trajectories and pacing as the implementation
specification. Generic palette, type-size, easing and five-beat defaults do not
override an explicit reconstruction brief. Search available motion components
for the measured effect, then adapt or author editable local HTML/GSAP with
deterministic seeking. A catalogue effect name alone is not evidence of a match.

Use the actual product identity and supported copy. Preserve the reference's
visual hierarchy when replacing text of a different length; adjust line breaks
and placement deliberately. Use a licensed local font, or document the closest
available fallback and its visible difference. Record intentional identity,
claim, music, aspect and duration changes in a reference-to-output mapping.

Keep the user's selected duration and music. If reference and target lengths
differ, preserve the characteristic speed and sequence of individual actions,
then plan the necessary additional beats or reading holds explicitly. Do not
slow a five-second reference threefold merely to fill fifteen seconds. If exact
timing and the requested length cannot both be met, explain that concrete
conflict before changing the requested length.

## Compare corresponding moments

Review reference and output side by side at the same normalized canvas size,
with corresponding action times identified. Compare the opening, each motion's
start/midpoint/landing, every transition and the final hold, plus playback at
normal speed. For a local reference, use matched-time frame pairs or overlays;
mask changed brand/copy regions only when assessing geometry, not when checking
readability. Inspect the whole output at 360 px width as well.

Set explicit tolerances in SPEC.md where measurements permit them. For example,
target a landing within one output frame and an unchanged object's bounds within
1% of canvas size. These are proposed review tolerances, not proof of matching
or universally required numbers. Record visible deviations and whether each is
intentional. Avoid invented similarity percentages.

Run the normal technical checks and visual review. In REVIEW.md separately state
reference availability, actual comparison coverage, matched properties and
remaining differences. Do not describe a film as faithfully reconstructed when
its source motion was never inspected. A passed linter proves no visual fidelity.
