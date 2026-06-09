---
name: staleTime Infinity list-mutation trap
description: Why list mutations in this app need optimistic setQueryData, not just invalidateQueries
---

The global queryClient sets `staleTime: Infinity` (client/src/lib/queryClient.ts). Under this default, a plain `invalidateQueries` after a create/add mutation does NOT reliably re-render a detail/list query — the refreshed list can fail to reflect the new row even though the server persisted it and the GET embeds it.

**Rule:** for any mutation that should grow/shrink a cached list, do an optimistic `queryClient.setQueryData(key, old => ...)` write so the UI updates synchronously, then call `invalidateQueries({ queryKey, refetchType: "all" })` as a background reconcile. `refetchType: "all"` (not the default `"active"`) forces the refetch even if RQ considers the query inactive at that instant.

**Why:** observed empirically — the add-puzzle list refused to update with plain invalidate despite a verified-correct server (POST persisted, GET embedded the children, DB confirmed the FK). The server was never the problem; the cache reconcile was. Optimistic write removes the timing/active-state dependency entirely.

**How to apply:** when wiring a new "add item to a parent" mutation in any Studio editor (Book, Puzzle, etc.), mirror the optimistic-append pattern rather than relying on invalidate alone. The same trap applies to delete/regenerate paths that need the list/content to change shape.
