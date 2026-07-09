---
name: Amazon PA-API eligibility gate
description: PA-API creds are valid but blocked by Amazon's 3-sales eligibility rule; interim uses static affiliate search links
---

# Amazon PA-API 5.0 — creds valid, blocked by eligibility

`AMAZON_ACCESS_KEY_ID` + `AMAZON_SECRET_ACCESS_KEY` are a valid, correctly-matched PA-API 5.0 pair (verified with a hand-signed SigV4 `SearchItems` request). Partner tag is `nicholaskreme-20` (US, `-20` suffix → `webservices.amazon.com`, region `us-east-1`, service `ProductAdvertisingAPI`).

**The only blocker is policy, not config:** PA-API returns `403 AssociateEligibilityException / AssociateNotEligible`. Amazon requires **3 qualifying sales in a trailing 180 days** before PA-API works. An "active" Associates account is NOT the same as PA-API eligibility.

**Why:** don't waste time re-debugging the keys — they're correct. Don't build any feature that *depends* on live PA-API data (prices/images/stock) until eligibility unlocks; it will 403 until then.

**How to apply:** interim product data uses static `amazon.com/s?k=SEARCH` affiliate search links with the tag applied server-side (`tagAmazonLink` in `server/seo/ssrShell.ts`). Those earn commission with no PA-API and are what drive the 3 sales that unlock it. Once eligible, PA-API turns on with no cred changes.

**Diagnostic ladder (error → cause):** `UnrecognizedClient` = access key ID wrong/not a real key (a 16-char lowercase+hyphen value is the associate tag pasted by mistake; real key is 20 chars, uppercase/digits, starts with `AK`). `InvalidSignature` = secret doesn't match the access key (must be same generated pair). `AssociateNotEligible` = keys fully correct, blocked by the 3-sales gate.

**Survivor Shop ASINs were dead (July 2026):** 33 of 35 curated ASINs in the survivor shop data 404'd on amazon.com — hallucinated/stale product IDs, so every "View on Amazon" click hit Amazon's page-not-found. Fix: shop now builds tagged `amazon.com/s?k=<brand+name>` search links client-side (`buildAmazonSearchUrl` in `client/src/lib/amazonLink.ts`); the `asin` field was removed from the shop data so bad IDs can't be reused. Do NOT reintroduce hardcoded `dp/ASIN` links anywhere without verifying each ASIN returns 200 — curated ASIN lists cannot be trusted. Datacenter curl to amazon `/s` search URLs returns 503 (bot-block) — that's not a failure; search pages always render in a real browser.
