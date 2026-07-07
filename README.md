# Version 3 - Geographic Scout and Navigation Build

This version separates the two map jobs:

- **Navigate** uses a true north-up geographic map with satellite/street basemaps and phone GPS.
- **Course Overview** displays the complete official spectator map as a reference image.
- **Clubhouse Detail** displays the official enlarged fan-zone inset separately.

## Important change: reliable phone saving

The Scout & Trace page now:

- Stores every accepted GPS route sample in `localStorage` immediately.
- Stores an unfinished route separately and recovers it after a refresh or accidental tab close.
- Shows the number of saved samples, points, and completed routes.
- Provides Download, Share, and Copy backup options.
- Includes a screen wake-lock button when supported.

Phone storage is local to that phone/browser. It will **not automatically sync to a laptop**. Export the JSON on the phone, transfer it through Drive/email/AirDrop, and import it at `review.html`.

## Upload to GitHub Pages

Upload every file from this folder to the root of the existing repository, replacing prior files. The build actively unregisters and clears service workers/caches left by earlier versions, so the previous mixed-version problem should not recur. After deployment, open the site with `?v=3` once.

## Field workflow today

1. Open `scout.html` on the phone.
2. Tap **Locate me** and verify the blue dot is at TPC Colorado.
3. Tap **Keep screen awake** when available.
4. Save facilities at their public entrance.
5. Record walking paths in short segments between meaningful junctions.
6. Finish each route before starting another.
7. Tap **Backup now** several times during the visit.
8. Transfer the final JSON to the laptop.
9. Open `review.html`, import the JSON, inspect routes on satellite view, and export a reviewed copy.

## No north-arrow correction is required

The geographic map is already north-up. The official illustrated map can remain rotated because it is only an overview. Directions should prioritize holes, cart-path forks, signs, and landmarks instead of relying only on compass directions.
