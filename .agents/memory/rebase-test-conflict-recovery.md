---
name: Rebase test conflict recovery
description: How to handle malformed test files after rebasing a feature onto a branch with overlapping test edits.
---

When a rebase resolves a test conflict but the resulting file has code outside its intended function, restore the last known-good coherent test version and manually reapply only the independent upstream setup or teardown behavior.

**Why:** A clean conflict-marker check and typecheck can miss test code that was interleaved around a closing brace, while the original feature regression suite remains the reliable behavioral baseline.

**How to apply:** Run the affected test file immediately after conflict resolution, inspect the full integration block if parsing fails, and preserve upstream changes by reconstructing them in valid test structure rather than retaining malformed merged text.