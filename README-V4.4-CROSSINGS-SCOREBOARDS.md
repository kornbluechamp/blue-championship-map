# Version 4.4 — Crossing Sections, Scoreboards, and Open-Area Approaches

Version 4.4 adds the final editing controls needed to maintain the published course map without returning to the course.

## Public map changes

- The filter label is now **Concessions**.
- A separate **Scoreboards** filter is available.
- Normal spectator paths are blue.
- Spectator crossings through playing areas are orange and may pause during play.
- Public street crossings are red and require extra caution.
- Directions retain orange and red crossing sections instead of covering the full route with one color.
- Dashed blue-gray lines show the approximate approach from a mapped path across an open spectator area to a destination.

## Review editor changes

Open:

`https://kornbluechamp.github.io/blue-championship-map/review.html?v=440`

The editor can:

- Add scoreboards and other destinations by tapping Street, Satellite, or the aligned Official map.
- Drag destination markers.
- Reshape existing paths.
- Draw missing paths.
- Select only part of a route and convert that section into:
  - Orange spectator crossing
  - Red public street crossing
  - Blue normal spectator path
- Rebuild the routing network with crossing metadata.

## Open areas near amenities

A separate route is not required when spectators may freely walk from the nearby mapped path to a restroom, concession, first-aid location, scoreboard, or hospitality entrance. The public map shows the final approach as a dashed line and explains that it assumes open spectator access.

Draw a short connector only when ropes, fencing, terrain, buildings, or a controlled entrance require a particular approach.

## Publishing

After editing:

1. Select **Export editable backup**.
2. Select **Export verified-data.json**.
3. Upload `verified-data.json` to the root of the GitHub repository and replace the existing file.
4. Wait for GitHub Pages deployment.
5. Open the public map with `?v=440` while testing.
