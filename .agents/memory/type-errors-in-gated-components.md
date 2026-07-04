---
name: Type errors in gated components crash only at render
description: Why undefined identifiers / type errors in auth+subscription-gated UI slip past workflow start and ungated screenshots
---

# Type errors in gated components crash only at render

Vite/tsx strips TypeScript types **without typechecking**, and `tsc --noEmit`
times out on this repo — so an undefined identifier (e.g. a constant referenced
but never defined/imported) does **not** fail the "Start application" workflow.
The server boots clean on port 5000 and the module transforms fine.

**The trap:** the crash is a runtime `ReferenceError` thrown only when the
offending component actually renders. If that component sits behind auth + an
active Stripe subscription (e.g. the RecoveryPremium cancel/retention dialog),
an ungated-page screenshot renders green while the real surface is broken.

**Why:** clean workflow logs + a clean landing-page screenshot are false
assurance for gated surfaces.

**How to apply:** before completing work on a gated/authed component you cannot
reach with a screenshot, run an architect review (`code_review` skill,
`includeGitDiff: true`) and/or grep every new identifier to confirm it is
defined or imported in-file. Do not rely on the workflow starting clean as proof
the component compiles.
