---
name: Blog outbound click privacy
description: Privacy and delivery boundary for buying-guide retailer click analytics
---

**Rule:** Outbound retailer analytics for public buying guides must remain anonymous: store only article slug, product category, recommendation, and timestamp. Delivery is fire-and-forget so a retailer navigation is never blocked.

**Why:** The site can measure editorial interest but cannot verify purchases, and storing browser or visitor identity is unnecessary for guide-level comparisons.

**How to apply:** Keep direct retailer URLs and their existing sponsored/nofollow attributes. Use same-origin beacon delivery with a keepalive fetch fallback, and aggregate reports by guide and recommendation.