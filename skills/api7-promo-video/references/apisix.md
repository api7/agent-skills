---
title: Apache APISIX identity and evidence
description: Official open-source branding, versioned technical proof and APISIX documentation CTAs.
metadata:
  category: brand
---

# Apache APISIX

Use the full product name “Apache APISIX” at least once. It is the Apache
open-source API gateway; do not present API7 Enterprise-only UI or capabilities
as part of the open-source project. Bundled `assets/brand/apisix.svg` is the
official project mark. Use #E83F3C as the single accent, preserve the mark's
existing paths and colors, and typeset the product name as normal text beside it.

Sources: [project](https://apisix.apache.org/),
[source repository](https://github.com/apache/apisix),
[documentation](https://apisix.apache.org/docs/apisix/).
Choose a feature-specific docs page as CTA for a feature film; getting started
for an introduction; the matching release notes for a release announcement.

## Request rate limiting example

Pin the technical example to Apache APISIX **3.19.0**,
[limit-req documentation](https://github.com/apache/apisix/blob/3.19.0/docs/en/latest/plugins/limit-req.md).
The CTA is [Configure rate limiting](https://apisix.apache.org/docs/apisix/plugins/limit-req/).
The CTA's current docs and the example's pinned source have separate roles.

```json
{
  "limit-req": {
    "rate": 1,
    "burst": 0,
    "key": "remote_addr",
    "key_type": "var",
    "policy": "local",
    "rejected_code": 429
  }
}
```

`rate` is a request rate per second, not an arbitrary fixed-window counter.
With `burst: 0`, excess requests are rejected rather than queued within a burst
allowance. HTTP 429 is explicitly configured here; the plugin's default is 503.
`key: remote_addr` applies the limit per client IP. `policy: local` applies on
each gateway instance independently; it is not a shared cluster quota.

For an animation, show requests following an allowed path to the upstream and
an excess path ending at a rejection response. The rejected path must not reach
the upstream. Label the diagram “Illustrative flow” and include “One gateway ·
Per client IP” in readable copy or the adjacent explanation. Do not imply a real
benchmark, DDoS protection guarantee or a measured response ratio. If showing
terminal results as live proof, run the configuration and preserve real output.

Use the official logo as identity; a diagram box labelled APISIX is an abstract
gateway, not a fabricated dashboard. No Docker deployment is required merely
to illustrate behavior already verified in the pinned documentation.
