import type { Building, Road } from "../backend";

export interface FictionalWorldResult {
  locationName: string;
  buildings: Building[];
  roads: Road[];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

type Theme = "village" | "castle" | "cyberpunk" | "walled" | "town";

function detectTheme(name: string): Theme {
  const lower = name.toLowerCase();
  if (
    ["village", "konoha", "pallet", "kakariko", "kokiri", "ninjago"].some((k) =>
      lower.includes(k),
    )
  )
    return "village";
  if (
    ["castle", "hyrule", "camelot", "hogwarts", "dragonstone"].some((k) =>
      lower.includes(k),
    )
  )
    return "castle";
  if (
    [
      "city",
      "midgar",
      "coruscant",
      "kamurocho",
      "neo",
      "cyber",
      "tokyo-3",
    ].some((k) => lower.includes(k))
  )
    return "cyberpunk";
  if (
    ["district", "shiganshina", "wall", "alma"].some((k) => lower.includes(k))
  )
    return "walled";
  return "town";
}

export function generateFictionalWorld(
  locationName: string,
): FictionalWorldResult {
  const seed = hashCode(locationName);
  const rand = mulberry32(seed);
  const theme = detectTheme(locationName);

  const buildings: Building[] = [];
  const roads: Road[] = [];

  const r = (min: number, max: number) => min + rand() * (max - min);
  const ri = (min: number, max: number) => Math.floor(r(min, max + 1));

  if (theme === "village") {
    const count = ri(40, 60);
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = r(5, 60);
      buildings.push({
        position: {
          x: Math.cos(angle) * dist,
          y: 0,
          z: Math.sin(angle) * dist,
        },
        size: { x: r(3, 8), y: r(3, 7), z: r(3, 8) },
      });
    }
    const roadCount = ri(10, 18);
    for (let i = 0; i < roadCount; i++) {
      const angle = (i / roadCount) * Math.PI * 2 + rand() * 0.3;
      const len = r(20, 60);
      roads.push({
        id: BigInt(i + 1),
        name: `Path ${i + 1}`,
        path: [
          { x: 0, y: 0, z: 0 },
          {
            x: Math.cos(angle) * len,
            y: 0,
            z: Math.sin(angle) * len,
          },
        ],
      });
    }
  } else if (theme === "castle") {
    // Central keep
    buildings.push({
      position: { x: 0, y: 0, z: 0 },
      size: { x: 20, y: 30, z: 20 },
    });
    // Courtyard buildings
    const inner = ri(8, 16);
    for (let i = 0; i < inner; i++) {
      const angle = (i / inner) * Math.PI * 2;
      const dist = r(25, 45);
      buildings.push({
        position: {
          x: Math.cos(angle) * dist,
          y: 0,
          z: Math.sin(angle) * dist,
        },
        size: { x: r(5, 12), y: r(8, 20), z: r(5, 12) },
      });
    }
    // Outer buildings
    const outer = ri(20, 35);
    for (let i = 0; i < outer; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = r(50, 100);
      buildings.push({
        position: {
          x: Math.cos(angle) * dist,
          y: 0,
          z: Math.sin(angle) * dist,
        },
        size: { x: r(4, 10), y: r(4, 12), z: r(4, 10) },
      });
    }
    // Radial paths
    const roadCount = ri(12, 20);
    for (let i = 0; i < roadCount; i++) {
      const angle = (i / roadCount) * Math.PI * 2;
      roads.push({
        id: BigInt(i + 1),
        name: `Courtyard Road ${i + 1}`,
        path: [
          { x: Math.cos(angle) * 12, y: 0, z: Math.sin(angle) * 12 },
          { x: Math.cos(angle) * 110, y: 0, z: Math.sin(angle) * 110 },
        ],
      });
    }
  } else if (theme === "cyberpunk") {
    const gridSize = ri(6, 9);
    const spacing = r(18, 28);
    const half = (gridSize * spacing) / 2;
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        buildings.push({
          position: {
            x: gx * spacing - half + r(-2, 2),
            y: 0,
            z: gz * spacing - half + r(-2, 2),
          },
          size: { x: r(4, 9), y: r(15, 50), z: r(4, 9) },
        });
      }
    }
    // Grid roads
    let roadId = 1;
    const roadCount = ri(20, 30);
    for (let i = 0; i < gridSize; i++) {
      if (roadId > roadCount) break;
      roads.push({
        id: BigInt(roadId++),
        name: `Grid Street ${i + 1}`,
        path: [
          { x: i * spacing - half, y: 0, z: -half },
          { x: i * spacing - half, y: 0, z: half },
        ],
      });
      roads.push({
        id: BigInt(roadId++),
        name: `Grid Ave ${i + 1}`,
        path: [
          { x: -half, y: 0, z: i * spacing - half },
          { x: half, y: 0, z: i * spacing - half },
        ],
      });
    }
  } else if (theme === "walled") {
    // Ring of wall buildings
    const wallSegments = ri(16, 24);
    const radius = r(80, 120);
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      buildings.push({
        position: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius,
        },
        size: { x: 8, y: 18, z: 8 },
      });
    }
    // Inner buildings
    const innerCount = ri(30, 55);
    for (let i = 0; i < innerCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = rand() * (radius - 20);
      buildings.push({
        position: {
          x: Math.cos(angle) * dist,
          y: 0,
          z: Math.sin(angle) * dist,
        },
        size: { x: r(4, 10), y: r(4, 12), z: r(4, 10) },
      });
    }
    // Roads
    const roadCount = ri(14, 22);
    for (let i = 0; i < roadCount; i++) {
      const angle = (i / roadCount) * Math.PI * 2;
      roads.push({
        id: BigInt(i + 1),
        name: `District Road ${i + 1}`,
        path: [
          { x: 0, y: 0, z: 0 },
          {
            x: Math.cos(angle) * (radius - 10),
            y: 0,
            z: Math.sin(angle) * (radius - 10),
          },
        ],
      });
    }
  } else {
    // town: moderate grid
    const count = ri(50, 80);
    for (let i = 0; i < count; i++) {
      buildings.push({
        position: {
          x: r(-80, 80),
          y: 0,
          z: r(-80, 80),
        },
        size: { x: r(4, 12), y: r(4, 16), z: r(4, 12) },
      });
    }
    const roadCount = ri(16, 26);
    for (let i = 0; i < roadCount; i++) {
      const horizontal = i % 2 === 0;
      const offset = r(-70, 70);
      roads.push({
        id: BigInt(i + 1),
        name: `Town Road ${i + 1}`,
        path: horizontal
          ? [
              { x: -90, y: 0, z: offset },
              { x: 90, y: 0, z: offset },
            ]
          : [
              { x: offset, y: 0, z: -90 },
              { x: offset, y: 0, z: 90 },
            ],
      });
    }
  }

  return { locationName, buildings, roads };
}
