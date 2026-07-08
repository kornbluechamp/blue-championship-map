# Publish Scouted Data for Everyone

## Why the public map did not show the phone data

Scout & Trace stores records in the browser storage of the phone that collected
them. The main public map loads shared data from `verified-data.json` in the
GitHub repository. Selecting "Show scouting data saved on this device" only shows
the private local copy on that one phone.

## Review and correct the data

1. Open:
   `https://kornbluechamp.github.io/blue-championship-map/review.html?v=340`
2. Select **Import / replace JSON**.
3. Choose the JSON exported from the scouting phone.
4. Click a point to edit:
   - Name
   - Type/category
   - Nearest hole or area
   - Notes
5. Enable point dragging to correct a point's position.
6. Click a route to edit:
   - Route name
   - Allowed / conditional / restricted status
   - Notes
7. Remove poor GPS samples or trim accidental start/end samples when needed.
8. Select **Export reviewed backup** and keep that file.

## Create the public file

1. Select **Export for public map**.
2. The browser downloads a file named exactly:
   `verified-data.json`

## Publish it on GitHub

1. Open the `blue-championship-map` GitHub repository.
2. Choose **Add file → Upload files**.
3. Upload `verified-data.json` to the repository root.
4. Confirm GitHub will replace the existing file.
5. Commit with:
   `Publish verified scouting data`
6. Wait for GitHub Pages deployment to finish.
7. Open:
   `https://kornbluechamp.github.io/blue-championship-map/?v=340`

Every visitor will then automatically receive the published points and route
lines. They will not need the scouting JSON and will not need to select
"Show scouting data saved on this device."

## Current routing status

Version 3.4 publishes and displays all reviewed destinations and path segments.
The nearest-location buttons currently compare straight-line distance. Full
shortest-path routing over the connected spectator path network is the next
development step after the route data has been reviewed and converted into a
connected graph.
