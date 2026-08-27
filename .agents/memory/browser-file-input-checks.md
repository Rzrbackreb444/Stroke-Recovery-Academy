---
name: Browser file-input checks
description: Reliable Puppeteer coverage for React file inputs and workspace Chromium discovery
---

When a React file-input handler clears `input.value` as soon as it receives a file, browser tests should set a real `File` through `DataTransfer`, assign it to `input.files`, and dispatch a bubbling `change` event. Puppeteer's upload helper alone may not produce the event in a way the component can consume.

**Why:** The survivor photo composer intentionally resets the input so selecting the same file again works; relying only on the helper led to a false timeout even though the page and API mocks were healthy. The workspace may also provide Chromium through Nix while Puppeteer's own browser cache is empty.

**How to apply:** Resolve `CHROME_BIN` first, then fall back to `command -v chromium` (or an equivalent installed browser). Assert user-visible failures with `document.body.innerText`, which excludes hidden content and avoids depending on Radix viewport attribute details.