---
name: Full-project tsc is impractical here
description: How to verify types after edits — LSP diagnostics, not full tsc
---

Full-project `npx tsc --noEmit` takes >15 minutes in this workspace (huge routes.ts + 300+ pages) and exceeds the 2-minute bash tool timeout even with `--max-old-space-size=6144`. Background/nohup polling wastes many round trips.

**Why:** Project size + constrained container memory make a cold full typecheck pathological.

**How to apply:** After edits, verify with `getLatestLspDiagnostics({ filePath })` (diagnostics skill, via code_execution) per touched file — returns in seconds and matches tsc for the edited surface. Also beware: `pkill -f "tsc --noEmit"` kills your own bash session because the command line contains the pattern; split the pattern string if you must kill it.
