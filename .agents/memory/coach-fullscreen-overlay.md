---
name: Coach full-screen overlay
description: How SasquatchCoach.tsx achieves full-viewport immersion despite the global RecoveryHeader in App.tsx
---

## Rule
`SasquatchCoach.tsx` outer wrapper uses `position: fixed; inset: 0; z-index: 100` — not `h-screen` or `h-dvh`.

## Why
App.tsx renders `<RecoveryHeader />` above all routes in the `<Router>` function. That header is `sticky top-0 z-50`, so it takes ~56-64px of viewport real-estate. Using `height: 100dvh` on a page inside this layout causes the page content to overflow (header + page > 100vh), pushing the sticky input bar off-screen. The `position: fixed; inset: 0` approach overlays the global header entirely with z-index: 100, giving the Coach route a true full-screen experience with my custom compact header as the only chrome.

## How to apply
Any page that needs a genuinely immersive full-screen layout (no site nav) should use this same pattern rather than `h-screen` or `min-h-screen`. The custom header inside the component takes over nav duties (back arrow, etc.).
