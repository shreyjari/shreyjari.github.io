# RAP · Diamond Prices

GitHub Pages landing page for the Rapaport price list PWA.

## Setup

1. Replace `YOUR_GAS_DEPLOYMENT_URL_HERE` in `index.html` with your GAS deployment URL
2. Add your icons to `icons/icon-192.png` and `icons/icon-512.png`
   - Dark background (#080809), gold diamond shape centred
   - Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate all sizes
3. Push to GitHub, enable Pages under Settings → Pages → Source: main branch

## Structure
```
index.html      ← landing page + PWA shell
manifest.json   ← PWA manifest
icons/
  icon-192.png  ← app icon (192×192)
  icon-512.png  ← app icon (512×512)
```

## How it works
- Desktop/Android: landing page with "Open Price List" button
- iOS Safari: landing page + "Add to Home Screen" nudge after 2s
- iOS Standalone (added to home screen): auto-redirects straight to the GAS app
