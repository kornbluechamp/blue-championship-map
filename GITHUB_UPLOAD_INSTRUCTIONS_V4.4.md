# Version 4.4 GitHub Update and Publishing Steps

## One-time website update

1. Unzip the Version 4.4 package.
2. Open the `blue-championship-map` repository in GitHub.
3. Select **Add file → Upload files**.
4. Upload every file from inside the unzipped folder into the repository root.
5. Replace matching files.
6. Commit with: `Publish Version 4.4 crossing editor`
7. Wait for GitHub Pages deployment.
8. Open the editor at:
   `https://kornbluechamp.github.io/blue-championship-map/review.html?v=450`

## Future map-data updates

After Version 4.4 is installed, route edits and new destination markers generally require replacing only one file:

`verified-data.json`

In Review:

1. Make the changes.
2. Export an editable backup.
3. Export `verified-data.json`.
4. Upload that file to the repository root and replace the existing copy.
5. Commit and wait for GitHub Pages deployment.
