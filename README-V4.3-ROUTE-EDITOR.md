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
