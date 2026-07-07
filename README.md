# Unofficial Volunteer Course Map — Starter

This package contains a first working mobile map and an onsite data collector.

## Works now

- Mobile-friendly tournament map.
- Tap-to-filter restrooms, first aid, concessions, gate, volunteer HQ and holes.
- Direct category links such as `?category=restroom`.
- Pan and zoom.
- Share/copy link.
- Offline caching after the first successful load.
- Field Scout page that captures GPS points and records cart-path tracks.
- JSON export.

## Not final yet

- Markers are approximate.
- Automatic nearest-destination selection is not enabled.
- Live location requires at least three calibration anchors.
- Safe routing requires cart-path and restriction data.
- Before broad public use, replace the supplied image with a clearly public spectator map or confirm permission to reuse it.

## Free deployment with GitHub Pages

1. Create a free GitHub account.
2. Create a new **public** repository named `blue-championship-map`.
3. Choose **Add file → Upload files**.
4. Upload every file from this package. Do not upload only the ZIP.
5. Commit the files.
6. Open **Settings → Pages**.
7. Choose **Deploy from a branch**.
8. Select `main` and `/ (root)`, then Save.
9. Wait a few minutes for GitHub to show the public URL.
10. Open the site on your phone.

The onsite collector will be at:

`https://YOUR-GITHUB-NAME.github.io/blue-championship-map/scout.html`

## After scouting

Upload the exported JSON and photos back to ChatGPT. The next build can add:
- Exact pins.
- Live “You are here.”
- Nearest restroom / first aid / concession.
- Safe route lines and simple walking directions.
- Full-map and category QR codes.
