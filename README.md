# Version 2.1 cache-fix package

This update fixes the most common mixed-version problem:
- It removes the old offline service worker and cached files.
- It adds version numbers to CSS and JavaScript requests.
- It permanently crops/removes the enlarged inset remnant from the full-course image.
- It permanently removes the printed legend area because the app has its own filters and map key.

Upload all files to the ROOT of the existing GitHub repository and replace files when prompted.

After GitHub Pages finishes deploying, open:
`YOUR-SITE-URL/?version=21`

If the old page still appears, use a private/incognito tab once.

# Unofficial Volunteer Course Directions - Version 2

## What changed
- Uses cropped artwork from the official public 2026 spectator-map PDF.
- Separates the geographic full-course map from the enlarged Clubhouse & Fan Zone detail.
- Removes the need for the printed legend; the app's filter buttons and menu key are the interactive legend.
- Adds more field-scout categories and photo references.
- Keeps approximate markers marked with yellow question marks until validated onsite.

## Replace the current GitHub Pages version
1. Extract this ZIP.
2. In the GitHub repository, upload all files from this folder.
3. When GitHub asks about duplicates, replace/overwrite the existing files.
4. Commit with a message such as `Update to official two-view course map`.
5. Wait for GitHub Pages to redeploy.
6. Refresh the website. On a phone, close and reopen the tab if the old cached version remains.

## Testing links
- Main map: `/index.html`
- Clubhouse view: `/?view=clubhouse`
- Restroom filter: `/?view=course&category=restroom`
- Field collector: `/scout.html`

## Important
The base artwork is from the official public spectator-map PDF. The interactive tool remains unofficial. Confirm tournament permission before broad distribution or printing.
