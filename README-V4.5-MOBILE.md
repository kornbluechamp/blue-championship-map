# Version 4.5 — Mobile-first public map

This update changes only the public website interface. It does not replace the
current `verified-data.json` that was already reviewed and published.

## Mobile behavior

- The destination shortcuts and map are visible near the top of a portrait phone.
- Restroom, First aid, and Concessions remain one-tap direction choices.
- Hole and named-place choices are under **More destinations**.
- Street, Satellite, Official, and the Official overlay toggle float over the map.
- The official overlay is on by default when the public map opens.
- Location, heading, and clear controls are compact and float near the bottom of the map.
- Filters and the path-color key are collapsed beneath the map.
- Desktop layout remains spacious.

## Upload

Upload every file from this package into the GitHub repository root and replace
matching files. This package intentionally does not contain `verified-data.json`,
so the newer public data already in GitHub remains unchanged.

Test with:

`https://kornbluechamp.github.io/blue-championship-map/?v=460`
