# Field-Day Collection Checklist

## Before walking

- Open `scout.html` while you have a good connection.
- Allow precise location.
- Confirm the blue dot is on the course.
- Verify GPS accuracy is preferably under 10-15 meters before saving a critical facility point.
- Enable **Keep screen awake** if supported.
- Create an initial **Backup now** file to confirm downloads work.

## Save facility points at the useful entrance

Capture:

- Restrooms and accessible restrooms
- First aid
- Concessions and water/refill points
- Main admission gate and exits
- Expo Row entrances
- Pro shop/merchandise
- Public viewing entrances
- Hospitality entrances
- Important cart-path junctions and spectator crossings
- Restricted/player-only/cart-only paths

## Trace paths in short segments

Good route names:

- Hole 9 green to 8/9/10 restroom junction
- Hole 10 tee to 8/9/10 amenity junction
- Hole 6 green to nearest public restroom
- Main gate to first aid
- Main gate to Expo Row

Stop and save at meaningful forks. Start a new segment after the fork. This will make routing much easier to build.

## If the route appears not to save

- Check that the sample count is increasing.
- The green save message should update after accepted GPS samples.
- Pause or finish the route before closing the page.
- If the page reloads, the unfinished route should be recovered.
- Use **Backup now**; the exported JSON includes the unfinished route as `activeRoute` even if it was not completed.

## Laptop review

- Transfer the JSON file from phone to laptop.
- Open `review.html`.
- Import JSON.
- Fit all data.
- Inspect every path against the satellite layer.
- Remove obvious low-accuracy samples or trim incorrect start/end samples.
- Drag facility pins only after confirming the correct location.
- Export the reviewed JSON and upload it back to ChatGPT.
