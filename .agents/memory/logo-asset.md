---
name: Sasquatch logo asset
description: Served logo is a downsized 512px webp/png; the 2000px master is preserved out of the served tree
---
# Sasquatch logo asset

- Served logo lives at public URL `/sasquatch-logo.png` and `/sasquatch-logo.webp` (files in `client/public/`). Referenced by an identical `const sasquatchLogo = "/sasquatch-logo.webp"` in ~9 components/pages.
- Both served files are **512x512** (webp ~38KB, png ~137KB). Max on-screen display is 160px, so 512 covers ~3x retina.
- The original **2000x2000 / 7MB** master is preserved at `attached_assets/sasquatch-logo-master-2000.png` (NOT served). Regenerate variants from this master with `sharp`, never from the downsized public copy.

**Why:** The 7MB PNG shipped on every page (logo in header/footer/widgets). Downsizing to 512 cut it ~99% with no visible quality loss.
