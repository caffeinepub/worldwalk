# WorldWalk

## Current State
Buildings are rendered as plain gray/beige colored box meshes with no texture detail. The buildings look like white rectangles, with color varying slightly based on position hash but no visual character.

## Requested Changes (Diff)

### Add
- Procedural canvas-generated textures for building facades: brick, concrete, glass curtain-wall, stone patterns
- Window patterns drawn onto building textures for visual depth
- Different building material styles based on building size/height (tall = glass, mid = concrete+windows, small = brick)
- Roof detail: flat rooftop texture variant
- Road surface material with asphalt-like color and lane markings
- Ground texture: sidewalk/grass appearance

### Modify
- BuildingMesh component: replace plain meshLambertMaterial with canvas texture + meshStandardMaterial
- GameScene ground: replace flat green plane with a more urban/natural ground texture
- RoadLine: consider rendering as flat road mesh instead of just lines

### Remove
- Plain grid helper (replace with ground texture)

## Implementation Plan
1. Create `buildingTextures.ts` utility that generates THREE.CanvasTexture for building facades using 2D canvas API (brick rows, window grids, concrete panels, glass reflections)
2. Update `BuildingMesh` to select texture style based on building height and apply to all 4 sides + top
3. Update ground plane material with a subtle asphalt/grass canvas texture
4. Keep performance reasonable: cache textures by style key, limit unique textures to ~6 variants
