# WorldWalk

## Current State
- Real-world locations fetched via OpenStreetMap Overpass API; buildings stored as centroid + bounding-box size
- Buildings rendered as plain THREE.BoxGeometry with procedural canvas textures (brick/glass/concrete/stone) chosen only by height
- No location-aware visual style; all cities look identical
- Fictional worlds generated procedurally by theme (village, castle, cyberpunk, etc.)
- First-person movement, multiplayer position sync, character creation all working

## Requested Changes (Diff)

### Add
- OSM building footprint polygon extraction: store full node arrays per building way
- ExtrudeGeometry rendering from actual footprint polygons so building shapes match reality
- Building height from OSM `building:levels` tag (default 3m per level) and `height` tag
- Region/country detection from Nominatim address fields (country_code, city, suburb)
- Location-aware visual theme system: color palette, material tint, sky color, ambient light, fog
  - Tokyo/Japan: beige/white plaster, warm hazy sky, sparse neon accents
  - New York/USA grid cities: red brick + glass towers, clear blue sky, busy
  - Paris/France/Europe historic: limestone/cream stone, overcast soft sky
  - London/UK: dark brick, grey sky
  - Middle East: sand/tan adobe, bright harsh sun
  - Default/unknown: neutral grey concrete
- Ground material matched to region (asphalt for cities, cobblestone for European historic areas)
- Wider road rendering using flat mesh planes instead of just Lines for more visual weight
- Sky color applied to Canvas background and optional fog gradient
- Pass region theme data through WorldData from LandingPage into GameScene

### Modify
- `osmFetch.ts`: extract full polygon points per building; read `building:levels` and `height` tags; detect region from Nominatim address; return theme info alongside buildings/roads
- `GameScene.tsx`: replace BoxGeometry with ExtrudeGeometry from footprint polygon; apply theme to lighting/sky/fog/ground
- `App.tsx` / `WorldData` type: extend with `theme` field
- `GameWorld.tsx`: pass theme to Canvas background color
- `fictionalWorldGen.ts`: no changes needed

### Remove
- `buildingTextures.ts` canvas procedural texture system (replace with MeshStandardMaterial color tints from theme)
- `getBuildingTexture` / `getGroundTexture` calls from GameScene

## Implementation Plan
1. Extend `WorldData` type in App.tsx with optional `theme: LocationTheme` field
2. Update `osmFetch.ts`:
   a. Parse each building way's full polygon node list
   b. Read `building:levels` (×3.5m) or `height` tag for accurate Y; fall back to area-based estimate
   c. Detect region from Nominatim `address.country_code`, city name; map to `LocationTheme`
   d. Return theme alongside buildings (buildings now carry polygon points)
3. Define `LocationTheme` type: skyColor, fogColor, fogNear/far, ambientIntensity, sunColor, groundColor, buildingPalette (array of hex)
4. Update backend `Building` type usage: store polygon as flat array of {x,z} pairs in a new field; keep position/size for collision
5. Update `GameScene.tsx`:
   a. Build THREE.Shape from polygon points, use ExtrudeGeometry for building meshes
   b. Apply theme-based MeshStandardMaterial colors cycling through palette by building index
   c. Set fog, sky (canvas background), ambient/directional light from theme
   d. Render roads as flat ribbon meshes (not just lines)
6. Remove buildingTextures.ts
7. Validate and deploy
