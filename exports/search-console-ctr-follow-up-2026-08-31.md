# Search Console CTR follow-up

**Property:** `https://strokerecoveryacademy.com/`  
**Search type:** Web  
**Supplied export:** `attached_assets/https___strokerecoveryacademy.com_-Performance-on-Search-2026-_1788198386149.zip`  
**Exported:** August 31, 2026  
**Window in export:** Last 24 hours, charted August 30–31, 2026 (UTC-05:00)

## Measurement status

The supplied archive is the original 151-impression / 2-click snapshot used to
choose the priority pages. It is not a second post-recrawl window. The older
June 7 archive does not contain these 11 blog URLs, so it cannot serve as a
valid before/after comparison.

The 11-page table below is therefore the **current recorded baseline**. Deltas
are intentionally `N/A`, not zero. A valid follow-up still requires a new
Search Console `Pages.csv` export for the same 11 exact URLs after Google has
recrawled the updated metadata.

## Site-level snapshot

| Scope | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| All pages in `Pages.csv` | 2 | 151 | 1.32% | Not provided in the page export |
| Priority pages (11 URLs) | 0 | 95 | 0% | 9.62 weighted by impressions |

The two site-level clicks belong to non-priority pages:

- `/blog/best-mobility-scooter-stroke-survivor` — 1 click, 8 impressions,
  12.5% CTR, position 6
- `/blog/best-pedal-exerciser-stroke-recovery` — 1 click, 5 impressions,
  20% CTR, position 10

The chart contains 149 impressions because the hourly chart and page table
were exported at slightly different aggregation states. Page-level totals are
used for the URL comparison because the requested comparison is by page.

## Priority-page comparison table

| URL | Prior clicks | Prior impressions | Prior CTR | Prior position | Observed clicks | Observed impressions | Observed CTR | Observed position | Deltas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/blog/best-ankle-brace-stroke-survivor` | N/A | N/A | N/A | N/A | 0 | 14 | 0% | 8.43 | N/A — no prior 11-URL export |
| `/blog/best-massage-gun-stroke-spasticity` | N/A | N/A | N/A | N/A | 0 | 13 | 0% | 5.62 | N/A — no prior 11-URL export |
| `/blog/best-stationary-bike-stroke-recovery` | N/A | N/A | N/A | N/A | 0 | 10 | 0% | 7.60 | N/A — no prior 11-URL export |
| `/blog/best-shoes-stroke-survivors` | N/A | N/A | N/A | N/A | 0 | 10 | 0% | 11.10 | N/A — no prior 11-URL export |
| `/blog/best-walker-stroke-survivor` | N/A | N/A | N/A | N/A | 0 | 10 | 0% | 12.50 | N/A — no prior 11-URL export |
| `/blog/hot-tub-hydrotherapy-stroke-recovery` | N/A | N/A | N/A | N/A | 0 | 8 | 0% | 7.25 | N/A — no prior 11-URL export |
| `/blog/best-adjustable-bed-wedge-pillow-stroke-recovery` | N/A | N/A | N/A | N/A | 0 | 8 | 0% | 7.75 | N/A — no prior 11-URL export |
| `/blog/adaptive-eating-utensils-stroke` | N/A | N/A | N/A | N/A | 0 | 7 | 0% | 21.43 | N/A — no prior 11-URL export |
| `/blog/best-resistance-bands-stroke-recovery` | N/A | N/A | N/A | N/A | 0 | 6 | 0% | 10.00 | N/A — no prior 11-URL export |
| `/blog/best-hand-therapy-tools-stroke-recovery` | N/A | N/A | N/A | N/A | 0 | 5 | 0% | 9.80 | N/A — no prior 11-URL export |
| `/blog/best-exercise-bike-stroke-patient` | N/A | N/A | N/A | N/A | 0 | 4 | 0% | 8.00 | N/A — no prior 11-URL export |
| **Total / weighted average** | **N/A** | **N/A** | **N/A** | **N/A** | **0** | **95** | **0%** | **9.62** | **N/A** |

Eight of the 11 pages are averaging positions 10 or better, but none of those
impressions produced a click in this short window. The three pages above
position 10 are the shoes page (11.10), walker page (12.50), and adaptive
utensils page (21.43).

## Highest-impact next adjustment

Prioritize the **massage-gun snippet** before changing internal links:

- It has the second-highest priority-page exposure: **13 impressions**.
- It has the strongest average position in the priority set: **5.62**.
- It has **0 clicks / 0% CTR**, so the bottleneck is more likely snippet
  selection or appeal than discoverability.
- The observed query `massage gun for stroke patients` appears once at position
  8. The current title leads with “stroke spasticity,” while the description
  says “after stroke.” The page already carries the observed wording as an
  extra keyword and in its opening, but bringing “for stroke patients” into
  the title or first description clause would make the search-result match
  more explicit.

Recommended next test, with the existing URL unchanged:

> **Title direction:** “Best Massage Gun for Stroke Patients: Safety Guide”
>
> **Description direction:** Lead with “Compare massage guns for stroke
> patients and spasticity…” and retain the current muscle-only treatment and
> safety qualification.

Do not interpret this one-day result as proof of a title win. Export the same
11 URLs again after recrawl and compare clicks, impressions, CTR, and
impression-weighted position over at least a 7-day window. If massage-gun
exposure remains high with a zero CTR, ship that snippet revision and then
re-measure before changing its internal-link pathway.

## Next export checklist

1. In the same Search Console property, keep **Web** search type selected.
2. Export **Pages** with the same 11 exact URLs, not only the top-pages default.
3. Keep the page metrics as **Clicks, Impressions, CTR, Position**.
4. Use a post-recrawl window of at least 7 days and record the exact dates.
5. Join on the full canonical URL; do not join on title, query, or URL fragments.
6. Calculate `CTR = clicks / impressions`, and calculate aggregate position
   weighted by impressions.