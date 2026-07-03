---
name: ripgrep match-display truncation
description: Displayed rg matches can be visually truncated at the match boundary in this environment; verify raw before acting.
---

When running `rg -n "some/long/path"` in the bash tool, the printed line can show a
**truncated** version of the matched text — e.g. searching `recovery/notifications`
rendered the file line as `<Route path="/n">`, and a `settings/notifications` match
rendered an href as `.../recovery/n`. The real file content was intact; only the
displayed match was clipped around the highlighted span.

**Why:** match-highlight rendering in the tool output pipeline can drop the tail of
the matched substring. It is a display artifact, not the file's actual content.

**How to apply:** If an rg result looks suspiciously short/mangled (paths ending
mid-word, missing segments), re-read the exact line with `grep -n`, `sed -n 'Np'`,
or the `read` tool before making an edit decision based on it. Don't "fix" a path
that only *looks* wrong in rg output.
