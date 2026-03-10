# WorldWalk

## Current State
WorldWalk is a 3D first-person multiplayer explorer. Users type a real-world location, which is geocoded and fetched from OpenStreetMap/Overpass. The resulting buildings and roads are rendered in a Three.js scene. The landing page has a single text input with real-world example locations.

## Requested Changes (Diff)

### Add
- A location-type toggle on the landing page: "Real World" (existing) vs "Anime / Game" tab.
- A curated list of iconic anime/game locations (Konoha, Hyrule Castle Town, Midgar, Kamurocho, Shiganshina, Pallet Town, Kakariko Village, etc.) shown as quick-select chips when in Anime/Game mode.
- A `fictionalWorldGen.ts` utility that procedurally generates themed Building[] and Road[] arrays from a fictional location name. Uses the location name as a seed for deterministic placement so the same name always gives the same world. Generates themed layouts (village, castle town, cyberpunk city, etc.) based on keyword matching.
- The `WorldData.locationCategory` field ("real" | "fictional") propagated to `GameWorld` so the HUD can show a themed badge.

### Modify
- `LandingPage.tsx`: add a two-tab toggle above the input. When in "Anime / Game" mode, the placeholder cycles through fictional examples, the explore handler calls `fictionalWorldGen` instead of `fetchOsmData`, and the example chips show anime/game locations.
- `App.tsx`: extend `WorldData` with optional `locationCategory: "real" | "fictional"`.
- `GameWorld.tsx`: HUD shows a small "Fictional" badge styled in purple/magenta when `locationCategory === "fictional"`.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/utils/fictionalWorldGen.ts` with seeded PRNG, keyword-based theme selection, and building/road layout generators for village, castle, cyberpunk, and open-world themes.
2. Update `App.tsx` to add `locationCategory` field to `WorldData`.
3. Update `LandingPage.tsx` with mode tabs, conditional logic, and anime/game example chips.
4. Update `GameWorld.tsx` HUD to show a category badge.
