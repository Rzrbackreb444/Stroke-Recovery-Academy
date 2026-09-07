---
name: Fixed Stripe catalog convention
description: SRA fixed offerings use metadata-keyed Stripe Products and Prices, while variable amounts remain inline.
---

Fixed SRA purchases must resolve a stable Stripe Price ID from the metadata-keyed catalog before checkout. Mutable marketplace and premium content also persist their current Price ID and reconcile it when published or repriced; tips and custom donations remain variable-amount flows.

**Why:** Inline price_data creates a new Stripe catalog object for every fixed purchase, which fragments reporting and complicates refunds.

**How to apply:** Add new fixed offerings to the canonical catalog resolver and use `line_items[].price`; only use inline `price_data` for genuinely variable amounts.