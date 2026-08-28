---
name: React unmount browser coverage
description: Browser-test guidance for verifying React effect cleanup and interacting with toast-covered controls
---

When browser coverage needs to observe React effect cleanup, trigger an in-app client-side route change rather than a hard page navigation. A full navigation can destroy the document before the cleanup callback's observable side effect runs. Toast viewports in this app may also cover controls while a toast is visible, so dispatch the target control's native event when the test is checking its handler rather than pointer hit-testing.

**Why:** Full navigation did not reliably expose the final object-URL cleanup, and the existing fixed toast viewport intercepted a physical click on the photo remove control.

**How to apply:** For component-unmount assertions, use an existing same-app link and wait for the resulting route. For handler-focused assertions behind transient overlays, use a direct DOM click and separately test pointer hit-testing only when that is the behavior under test.