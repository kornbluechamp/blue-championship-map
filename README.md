# TPC Colorado Course Guide — Version 4.0

Public address after GitHub upload:
`https://kornbluechamp.github.io/blue-championship-map/`

Version 4.0 includes the cleaned July 7 scouting dataset and a connected spectator-path routing network.

## Main improvements

- Public data loads automatically from `verified-data.json`.
- 86 public locations and 37 path segments are included. Volunteer-only and player-only records remain only in the cleaned backup.
- Path-distance routing is available for restrooms, first aid, concessions, and selected holes.
- Restrooms and accessible restrooms use the same `R` marker.
- Hole references are hidden by default and available through Filters.
- Pro Shop is correctly categorized.
- Route endpoints and high-confidence gaps are connected.
- The unapproved Hole 8 cart path is not included.
- Follow North, Heading Up, and Free Explore modes are available.
- Thirty-five tee/green points are retained as official-map alignment anchors.

Read:
- `GITHUB_UPLOAD_INSTRUCTIONS.md`
- `CLEANUP_AND_NETWORK_NOTES.md`

Important: this remains an unofficial navigation aid. Posted signs, ropes, staff, security, and accessibility guidance always take priority.


# Version 4.3 — Route Geometry Editor

This release adds a visual map editor for correcting path and street-crossing
geometry after scouting.

## Review page

Open:

`https://kornbluechamp.github.io/blue-championship-map/review.html?v=430`

The current public `verified-data.json` loads automatically.

### Existing routes

Choose a route from the dropdown or tap a line, then select **Edit route shape**.

The editor supports:

- Dragging route shape handles
- Selecting a handle and moving it by tapping the map
- Inserting a new bend
- Extending the route start or end
- Snapping a selected handle to the nearest other route
- Deleting a selected shape point
- Undoing geometry changes
- Simple, detailed, or all-sample handle views

### New destinations

Select **Add a destination**, complete the fields, and tap the public entrance or
spectator approach point on Street or Satellite.

### Missing paths

Select **Draw a missing path** and tap the map in walking order.

### Routing network

The editor automatically rebuilds the public routing network from the edited
route geometry when you select:

- Rebuild routing now
- Export editable backup
- Export verified-data.json

## Publish

Upload the exported `verified-data.json` into the repository root and replace the
existing file.


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
