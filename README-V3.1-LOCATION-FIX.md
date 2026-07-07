# Version 3.1 — Mobile Location Permission Fix

This package fixes the mobile GPS permission issue in Version 3.

## What was wrong

Version 3 attempted to start GPS automatically during page load. Some mobile
browsers suppress permission prompts that are not triggered by a direct user tap.
The app then believed a watch had already started, so tapping Locate me could
appear to do nothing.

## What changed

- GPS is no longer requested during page load.
- Locate me requests one precise position directly from the user's tap.
- Continuous tracking starts only after the first successful reading.
- Failed watches are reset so Try again works.
- The page clearly reports blocked permission, timeout, unavailable GPS, and
  non-HTTPS problems.
- Starting a route or saving a GPS point can also trigger the permission request.
- Asset versions were changed to v=310 to prevent old JavaScript from being used.

## Upload

Upload every file in this package to the ROOT of the same GitHub repository.
Commit, wait for GitHub Pages to finish, then open:

`YOUR-SITE/scout.html?v=310`

Use a private/incognito tab for the first test if the old script still appears.
