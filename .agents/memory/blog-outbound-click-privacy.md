---
name: Blog outbound click privacy
description: Privacy and delivery boundary for buying-guide retailer click analytics
---

**Rule:** Public buying-guide analytics must remain anonymous: store only article slug, product category/recommendation for clicks, and timestamp. Guide views and clicks are aggregate interest signals, not purchases. Delivery is fire-and-forget so navigation is never blocked.

**Why:** The site can measure editorial interest but cannot verify purchases, and storing browser or visitor identity is unnecessary for guide-level comparisons.

**How to apply:** Keep direct retailer URLs and their existing sponsored/nofollow attributes. Use same-origin beacon delivery with a keepalive fetch fallback for both page views and clicks, and aggregate reports by guide and recommendation.