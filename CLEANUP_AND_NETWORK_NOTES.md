# Version 4.0 — Cleaned Data and Connected Spectator Network

Source scouting export:
`tpc-colorado-scout-2026-07-07-22-11-42.json`

## Data cleanup completed

- Corrected obvious spelling errors in location and route names.
- Standardized hole references as `Hole # Tee`, `Hole # Fairway`, and `Hole # Green`.
- Changed `Pro Ship` from `Other` to `Pro Shop` with type `proshop`.
- Changed `18th Green Suites` from a hole reference to hospitality.
- Changed the player outhouse to a restricted, nonpublic location.
- Grouped volunteer parking and Volunteer Headquarters under the staff filter.
- Preserved accessible-restroom status while using the same `R` marker as other restrooms.
- Created 35 official-map anchor candidates from the recorded tee and green points.

## Public display defaults

Shown by default:
- Restrooms and accessible restrooms
- First aid
- Concessions
- Gates, clubhouse, Pro Shop, and public places
- Spectator path lines

Hidden by default but available through Filters:
- Tee, fairway, and green reference points
- Junction and crossing markers
- Volunteer/staff and restricted locations

## Route network work

The 29 scouted routes were retained. Short endpoint differences were snapped together where the intended connection was clear. Nine generated connectors were added using recorded endpoints, junctions, amenities, tee references, and crossing points.

The published routing network contains:
- 86 public mapped points
- 37 displayed path segments, including generated connectors
- 1,373 routing nodes
- 1,378 routing edges
- One connected spectator network

Volunteer parking, Volunteer Headquarters, the player-only restroom, and the volunteer-parking route remain in the cleaned backup but are intentionally omitted from the public JSON.

The generated connectors are labeled in their map popups. They should be treated as approximate where a short section was not actively traced.

## Hole 8 protection

The Hole 8 cart path was intentionally not added. The only included Hole 8-area route is the recorded spectator connection from the rear crossing to the Hole 9 tee crossing. The public routing network will not use the omitted Hole 8 cart path.

## Navigation improvements

The public map now supports:
- Path-distance routing to the nearest restroom, first aid, or concession
- Routing to a selected hole
- Street and Satellite base maps
- Filters for holes, junctions, staff, amenities, places, and paths
- Follow North mode
- Heading Up mode using GPS movement direction and phone orientation when available
- Manual Free Explore mode
- Automatic loading of shared `verified-data.json`

## Official illustrated overlay

The cleaned data includes 35 tee/green anchor candidates. The official illustration is still shown as a reference tab. A true geographic overlay requires matching selected anchor candidates to their exact pixel positions on the illustration and then creating a warped north-up overlay image. No additional course walk should be required for that step.
