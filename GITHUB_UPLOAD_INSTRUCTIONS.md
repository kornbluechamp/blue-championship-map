# Upload Version 4.0 to GitHub Pages

Repository:
`kornbluechamp/blue-championship-map`

Public site:
`https://kornbluechamp.github.io/blue-championship-map/`

## Upload

1. Download and unzip the Version 4.0 package.
2. Open the GitHub repository.
3. Select **Add file → Upload files**.
4. Upload every file from inside the unzipped folder into the repository root.
5. Confirm that `verified-data.json` is beside `index.html`, not inside another folder.
6. Replace existing files when GitHub indicates matching filenames.
7. Use this commit message:
   `Publish cleaned scouting map and connected routing`
8. Wait for the GitHub Pages deployment to finish.

## Test after deployment

Open:
`https://kornbluechamp.github.io/blue-championship-map/?v=400`

Confirm:
- Published locations and paths appear without importing a JSON file.
- Restrooms and accessible restrooms both use the `R` marker.
- Hole markers are hidden until **Filters → Hole reference points** is enabled.
- Pro Shop appears as Pro Shop.
- **Nearest restroom** requests location and highlights a route.
- **Follow: North up** cycles to **Heading up** and **Off**.

## Files to retain separately

- `tpc-colorado-cleaned-reviewed.json` — cleaned editable backup
- Original raw scouting JSON — untouched source backup
- `verified-data.json` — public shared dataset loaded by the website
