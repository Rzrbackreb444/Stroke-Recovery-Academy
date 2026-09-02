---
name: Search Console comparison windows
description: Chronology requirements for trustworthy post-recrawl Search Console comparisons
---

The observed Search Console window must occur entirely after the baseline measurement and the verified metadata deployment/recrawl boundary before its deltas can support a before/after SEO decision.

**Why:** A seven-day export can pass Web-search, URL-coverage, and date-count checks while still predating or overlapping the baseline. Its clicks and CTR are then historical observations, not evidence that the metadata change caused an outcome.

**How to apply:** Record the baseline and recrawl boundary with the comparison inputs, reject or clearly label any observed range that is not later, and avoid changing snippets from a chronologically invalid comparison.