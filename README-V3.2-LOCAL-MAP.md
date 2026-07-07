# Version 3.2 — Local Map Engine Fix

The location diagnostic proved Chrome and Android permissions are working. The Scout page was failing before it could attach the Locate button because Leaflet was loaded from an external CDN and did not load on the phone.

Version 3.2 includes its own local geographic map engine, so no external JavaScript or CSS library is required. Basemap imagery still loads from Esri or OpenStreetMap, but GPS collection, buttons, markers, lines and JSON saving work even if map tiles are temporarily unavailable.

Upload every file to the repository root, wait for Pages deployment, and open:

`YOUR-SITE/scout.html?v=320`

You should see the course map immediately, even while at home. Locate me moves to your home position; Show course returns to TPC Colorado.
