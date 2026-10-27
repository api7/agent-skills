---
title: Approved product feed style
description: Reuse the approved light brand treatment, unified Inter typography, continuous card motion and concise announcement copy.
metadata:
  category: production
---

# Approved feed profile

Use this profile for authored product promos unless the user requests another
style. It records the AISIX model-support film approved on 2026-10-27. Apply its
visual principles to APISIX/API7 with the correct identity. Real product UI,
code, captions and long tutorials retain the layout and reading time they need.
This is an approved house treatment, not a claim that the source publisher uses
these exact fonts, colors or easing curves. For a newly supplied reference,
follow [Reference fidelity](reference-fidelity.md); explicit user changes win.

## Palette and stage

- Light ground #FAF9FC, main text #181C20, secondary text #58616D; white cards,
  fine #E7EAE8 dividers, restrained shadow. One primary brand accent.
- Approved AISIX treatment: accent #E31836; two broad, low-opacity radial light
  pools from the API7 homepage hues #6D49FF and #FF4646, alpha .22/.20, with
  soft edges and slow continuous drift. These are brand atmosphere, not a
  high-contrast rainbow or a decorative full-screen effect. Keep text on a
  quiet light surface. Do not copy the reference's blue/green palette.
- This palette is the approved campaign snapshot, not a permanent corporate
  style guide. Verify official assets/theme when a new brief calls for them.
  APISIX keeps its own official mark and accent; do not recolor it to API7 purple.
- For the model-support card format, 16:9 gives the brand/model pairing and
  support rows room. Use the content-led ratio rules for other formats; always
  recompose, rather than squeeze, a square/4:5 adaptation.
- In the approved 1920×1080 composition the card begins at x380/y216, size
  1160×622, radius28, shadow0/24/48px. It enlarges to1.25 for support and settles
  at1.15 for setup. These are a reusable example, not coordinates to impose on
  a different ratio, content length or real UI capture.

## One type system across pages

Use bundled Inter400/700 for authored titles, body, metadata and setup fields.
At 1920×1080 (1080px short edge), start from exactly four role sizes:

| Role | Size | Weight and usage |
|---|---|---|
| Hero | 96px | 700 brand; 400 model in the horizontal pairing, same size/line box |
| Heading | 64px | 700 section title/CTA; 400 model on the end card |
| Body | 56px | 400 labels/descriptions; 700 key setup values |
| Metadata | 40px | 400 headers/status; 700 brand identifier where useful |

Keep these roles consistent across the opening, support card, setup and end
card. Do not add isolated sizes, uppercase tracking or a code font just because
a label is model_name. Preserve exact identifiers (hyphens, underscores, case)
without changing the rendered family. Code samples/real UI in a tutorial may
retain a readable monospace font; they are not short-card labels.

Use shared line heights (about1.2–1.25), weight and whitespace to create hierarchy.
Do not make adjacent notes compete by switching font, color and weight. Review
at360px width: important text should reach about12px there (64px effective size
on a1920px canvas). The approved56px body at1.15 scale is64.4px effective.
If text fails, shorten it or enlarge the content stage; do not keep shrinking.
Metadata and a secondary company mark cannot carry the only essential fact.

Set setup rows as two aligned columns. Center each row vertically; keep labels
and values on common baselines. With two rows in the example card, use local
x56/y201/w1048, row height156, label column352 and gap30: equal space above and
below the field block under its92px header. Rebalance when rows are removed.
For flow diagrams, center multiline labels as a block in their nodes, keep
branching nodes symmetric about the connecting axis, and leave visible room
between boxes for the full connector/packet path at phone size. No-overflow
checks alone do not establish alignment or comfortable spacing.

The reusable [profile CSS](../assets/approved-feed.css) supplies local fonts,
tokens and opt-in type/card/field classes. The scaffold inserts it for authored
scenes using {{STYLE}}; the traffic-flow starter keeps its own layout CSS.
Compose the scene markup and deterministic timeline; CSS alone is not a video.

## Motion grammar: continuity, focus, landing

Use one focal action at a time. Start with a centered brand; move it horizontally
to make room for the model, then reveal the support line. Transform the visual
argument into a white card; stagger rows, sweep a quiet highlight upward, trace
the active row outline, add a support badge and make one smooth card enlargement.
The same card becomes setup information before clearing into the final CTA.

Do not replace this with unrelated slides and repeated generic fades. Fade an
outgoing text group before the next card becomes readable: no ghosted words
behind the new content. Use stable anchors, identical row alignment and a paused
GSAP timeline with absolute times. Avoid bounce/elastic overshoot, 3D tilt,
random particles and simultaneous attention-grabbing motion.

Approved15s example (times are output seconds, not a default requested length):

| Action | Timing / curve |
|---|---|
| Brand shifts left; model lands beside it | .48–.86 / .65–.90; power3.inOut / power3.out |
| Support line lands; readable opening hold | .88–1.10; pairing holds until2.30 |
| Outgoing group fades before card reads | 2.36–2.53; exit about.17s |
| Card arrives; lower rows stagger | 2.53–2.78; rows2.72/2.86/3.00, power3.out |
| Highlight travels up; card enlarges | 3.19–3.60 / 3.42–4.27; power2.inOut |
| Outline draws; badge lands | 3.65–3.87 / 3.93–4.16 |
| Support holds, then same card becomes setup | hold to7.60; setup lands7.78–8.30 |
| Card clears and final CTA lands | exit11.78–12.02; CTA group11.98–12.47 |
| Final reading hold | 12.47–15.00 (about2.53s) |

Background drift uses sine.inOut; exact reference curves were not recovered.
For a different requested length, keep the speed of characteristic actions and
rebudget holds/content. Do not stretch a5.5s reference to15s wholesale or assume
every film needs these beats. Full tutorials/demos use real action/result cuts,
with this typography and restrained transitions around them.

## Copy: three levels of information

1. **On-screen short announcement:** what is newly supported; a few useful,
   verified compatibility facts; minimal setup inputs; one action. For the
   approved setup page this was Provider/OpenAI and model_name/the exact model.
   A drawn information card is not a screenshot or evidence of a real console.
2. **LinkedIn post:**40–70 English words in the body, plus one matching CTA/URL.
   Lead a release with the new capability; lead a value explainer with the user
   problem. State the relevant version/test scope. Add one useful detail rather
   than repeating every screen. Avoid hype, ambiguous arrows and unsupported
   claims of availability in a stable release.
3. **Technical notes:** parameter restrictions, protocol-specific differences,
   environment-specific observations, pricing sync/accounting, and reproduction
   details that need explanation. Store in POST-DETAILS.md or TECHNICAL-NOTES.md,
   separately from the text intended to be posted. A safety-critical caveat that
   changes the promise must still be clear on screen/in the post; narrow the
   claim instead of hiding contradictory evidence in notes.

Keep version/test-scope qualifiers visible with the claims they qualify, long
enough to read. Recheck reading time after replacing example copy; the timing
table does not authorize flashing a qualifier too briefly to understand.

Do not put shorthand such as “Reasoning + tools → Responses” or a bare sampling
reminder into an already small setup card. Explain any needed guidance in a
sentence (“For reasoning with tools, use the Responses API.”). Do not describe
an unpriced request's cost0 as free provider usage. Pricing is not inherently
forbidden: include it only when it is the selected subject, source-backed and
clear in the available time. A complete tutorial must retain necessary operating
constraints; the announcement's brevity is not permission to omit them.

End card: product/feature name, one plain CTA, display domain, correct official
identity. Keep billing, disclaimers and unrelated benefits off the default end
card; hold the landed CTA for at least2s. Match its text and destination in the
post. Never invent new brands, models, dates or test claims from this example.

For a short no-narration brief, use clear English visual copy and the selected
light instrumental. Prefer free commercial-use music without required public
attribution when it fits the brief; check current license terms and record
provenance internally even when no public credit is required. Do not hardcode
musicE/the sample track into future films or ship its audio with this skill.
The user still chooses narration and supplies/delegates the target duration.
