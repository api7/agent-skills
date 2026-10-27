---
title: Video types and duration planning
description: Separate the user's target duration from announcement, feature, tutorial and demo scope.
metadata:
  category: production
---

# Choose type and length separately

Capture an explicit target duration in seconds (`duration`) and a type
(`videoType`). Accept natural language such as “10 seconds”, “about 45 seconds”
or “3 minutes”; normalize it in the brief. No length is assumed when missing.
Do not infer it from the type, platform, reference or previous sample. Ask once
for the missing target before writing a timed script or starting media work.
A supplied range authorizes choosing and stating a target inside it. Explicit
delegation also authorizes choosing and stating a target; record that choice
and delegation rather than adding a confirmation stop.
For a revision, preserve the agreed duration unless the request changes it.

| Type | User outcome | Typical length, not a limit | Structure and proof |
|---|---|---|---|
| `announcement` | Learn one newly available capability, such as a newly supported model | 5–20s | What changed → one useful implication or visible request → CTA. Verify exact model identifier, supported version/edition and release status; distinguish newly supported from already supported. |
| `feature` | Understand why one capability matters | 20–90s | User problem → product action → visible result → CTA. A diagram can explain a boundary; label it as illustrative. |
| `tutorial` | Complete a topic or task, such as request rate limiting | 2–10min | Outcome and prerequisites → configuration steps → execute → verify success and failure cases → scope/caveats → CTA. Use real configuration and captured results. |
| `demo` | See a working scenario from input to result | 30s–5min | Scenario → actual actions → observable result → takeaway/CTA. A brief demo can show one interaction; a longer demo can follow a complete workflow. |

These are editorial starting points. A 45-second tutorial or a 3-minute feature
explanation is valid if its promised outcome fits. Do not make a video longer
by slowing a short template, looping requests or padding with a motionless card.

## Budget the requested duration

- Write scene/step start, duration, copy/narration, visual proof and source.
  Scene durations must sum to the target, aligned to 30 fps. Leave the final CTA
  fully readable for at least 2 seconds after its entrance.
- For announcements, remove background explanation before shrinking text. A new
  model's name and one benefit may be enough; do not add a miniature tutorial.
- For tutorials, keep prerequisite and configuration steps that viewers need to
  reproduce the result. Show typed values and results long enough to follow.
  State omissions in the brief instead of promising a complete tutorial that
  skips setup or verification.
- For demos, plan around the actual captured interaction. Trim dead waits;
  identify accelerated footage and retain the result long enough to inspect.
- For narration, time a read or use the audio's actual duration. Allow pauses
  for actions and results. Avoid fitting a script through aggressive speech
  speed; cut scope or ask to increase length if the requested outcome will not
  fit. Preserve the target until the user changes it.
- A single final CTA can follow several chapters. Chapter navigation and
  instructional steps are not extra marketing CTAs. Keep the accompanying
  publishing description concise even when the video is long.

## Brief and invocation examples

The normalized brief always includes `product`, `videoType`, `duration`, topic,
audience, source/version, language, aspect, narration/captions, proof and CTA.
The scaffold stores type/length in content.json and production notes. Detailed
authored-scene/media inputs are in [Production](production.md).

- “Use $api7-promo-video. Product: AISIX. Type: announcement. Target: 10 seconds.
  Topic: support for this model, using the attached official release note.
  English text, no voiceover, square, one docs CTA.”
- “Make a 45-second AISIX feature explainer about stable model aliases.
  English narration and captions; show why centralized configuration helps.”
- “Make a 3-minute APISIX request rate-limiting tutorial. Use real configuration
  and results, cover prerequisites and 429 responses, 16:9, English narration.”
- “Make a 90-second API7 demo of this configured workflow, from input to result.
  Use the supplied screen recording; include captions and a quickstart CTA.”

“Make a rate-limiting video” is not yet ready for a timed script: ask for target
length and infer/clarify whether the goal is a teaser, explanation or operation.
