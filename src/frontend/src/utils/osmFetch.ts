import type { Building, Road } from "../backend";

export interface LocationTheme {
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  groundColor: string;
  buildingPalette: string[];
  roadColor: string;
  region: string;
}

export function getThemeForRegion(region: string): LocationTheme {
  switch (region) {
    case "japan":
      return {
        skyColor: "#c8d8e8",
        fogColor: "#c8d8e8",
        fogNear: 80,
        fogFar: 400,
        ambientColor: "#fff5e0",
        ambientIntensity: 0.7,
        sunColor: "#fffbe0",
        sunIntensity: 1.2,
        groundColor: "#606050",
        buildingPalette: [
          "#e8e0d0",
          "#d8d0c0",
          "#f0ece4",
          "#c8c4bc",
          "#dcd8cc",
        ],
        roadColor: "#555548",
        region: "japan",
      };
    case "usa_dense":
      return {
        skyColor: "#87CEEB",
        fogColor: "#b0cce0",
        fogNear: 100,
        fogFar: 600,
        ambientColor: "#ffffff",
        ambientIntensity: 0.6,
        sunColor: "#ffffff",
        sunIntensity: 1.5,
        groundColor: "#404040",
        buildingPalette: [
          "#8b4a3a",
          "#7a3d32",
          "#555566",
          "#334455",
          "#a0988a",
          "#cc9966",
        ],
        roadColor: "#333333",
        region: "usa_dense",
      };
    case "usa_default":
      return {
        skyColor: "#90b8d0",
        fogColor: "#a0b8c8",
        fogNear: 100,
        fogFar: 500,
        ambientColor: "#ffffff",
        ambientIntensity: 0.6,
        sunColor: "#ffffff",
        sunIntensity: 1.3,
        groundColor: "#484848",
        buildingPalette: [
          "#708090",
          "#5a6070",
          "#808890",
          "#6a7480",
          "#504840",
        ],
        roadColor: "#383838",
        region: "usa_default",
      };
    case "france":
      return {
        skyColor: "#d4dce8",
        fogColor: "#d0d8e4",
        fogNear: 80,
        fogFar: 400,
        ambientColor: "#f0eeee",
        ambientIntensity: 0.65,
        sunColor: "#ffe8c0",
        sunIntensity: 1.1,
        groundColor: "#6a6050",
        buildingPalette: [
          "#e8e0cc",
          "#ddd4bc",
          "#f0e8d4",
          "#c8c0ac",
          "#d4cbb8",
        ],
        roadColor: "#7a7060",
        region: "france",
      };
    case "uk":
      return {
        skyColor: "#9aa8b4",
        fogColor: "#9aa8b4",
        fogNear: 60,
        fogFar: 300,
        ambientColor: "#c0ccd4",
        ambientIntensity: 0.6,
        sunColor: "#d0d8e0",
        sunIntensity: 0.9,
        groundColor: "#3a3a34",
        buildingPalette: [
          "#4a3c34",
          "#5a4a40",
          "#6a5848",
          "#3c3028",
          "#7a6860",
        ],
        roadColor: "#2a2a24",
        region: "uk",
      };
    case "europe_central":
      return {
        skyColor: "#b8ccd8",
        fogColor: "#b8ccd8",
        fogNear: 80,
        fogFar: 400,
        ambientColor: "#f0f0f0",
        ambientIntensity: 0.65,
        sunColor: "#fffae0",
        sunIntensity: 1.1,
        groundColor: "#5a5448",
        buildingPalette: [
          "#c8c0b0",
          "#b8b0a0",
          "#d8d0c0",
          "#a8a098",
          "#e0d8c8",
        ],
        roadColor: "#6a6458",
        region: "europe_central",
      };
    case "middle_east":
      return {
        skyColor: "#e8d8b0",
        fogColor: "#e0d0a8",
        fogNear: 100,
        fogFar: 500,
        ambientColor: "#ffe8a0",
        ambientIntensity: 0.8,
        sunColor: "#ffeeaa",
        sunIntensity: 1.4,
        groundColor: "#c8b870",
        buildingPalette: [
          "#d4c898",
          "#c8b880",
          "#e0d4a8",
          "#b8a870",
          "#dccca0",
        ],
        roadColor: "#a89860",
        region: "middle_east",
      };
    default:
      return {
        skyColor: "#7a9ab0",
        fogColor: "#8a9aa8",
        fogNear: 100,
        fogFar: 500,
        ambientColor: "#dddddd",
        ambientIntensity: 0.6,
        sunColor: "#ffffff",
        sunIntensity: 1.2,
        groundColor: "#555555",
        buildingPalette: [
          "#666666",
          "#777777",
          "#555555",
          "#888888",
          "#606060",
        ],
        roadColor: "#333333",
        region: "default",
      };
  }
}

function detectRegion(countryCode: string, displayName: string): string {
  const cc = (countryCode || "").toLowerCase();
  const dn = (displayName || "").toLowerCase();

  if (cc === "jp") return "japan";
  if (cc === "fr") return "france";
  if (cc === "gb") return "uk";
  if (["de", "at", "ch", "nl", "be"].includes(cc)) return "europe_central";
  if (["sa", "ae", "eg", "ma"].includes(cc)) return "middle_east";
  if (cc === "us") {
    if (
      dn.includes("new york") ||
      dn.includes("chicago") ||
      dn.includes("boston")
    ) {
      return "usa_dense";
    }
    return "usa_default";
  }
  return "default";
}

export interface OsmResult {
  locationName: string;
  buildings: Building[];
  roads: Road[];
  buildingPolygons: Array<{ x: number; z: number }[]>;
  theme: LocationTheme;
}

function latLonToLocal(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
): { x: number; z: number } {
  const x = (lon - centerLon) * 111320 * Math.cos((centerLat * Math.PI) / 180);
  const z = (lat - centerLat) * 110540;
  return { x, z };
}

export async function fetchOsmData(locationQuery: string): Promise<OsmResult> {
  // 1. Geocode
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    locationQuery,
  )}&format=json&limit=1&addressdetails=1`;

  const geoRes = await fetch(nominatimUrl, {
    headers: { "Accept-Language": "en", "User-Agent": "WorldWalk/1.0" },
  });

  if (!geoRes.ok) {
    throw new Error("Geocoding service unavailable");
  }

  const geoData = await geoRes.json();

  if (!geoData || geoData.length === 0) {
    throw new Error(
      `Location not found: "${locationQuery}". Try a different search.`,
    );
  }

  const result = geoData[0];
  const centerLat = Number.parseFloat(result.lat);
  const centerLon = Number.parseFloat(result.lon);
  const displayName: string = result.display_name || locationQuery;
  const shortName = displayName.split(",").slice(0, 2).join(",").trim();

  // Detect region from country code + display name
  const countryCode: string = result.address?.country_code || "";
  const region = detectRegion(countryCode, displayName);
  const theme = getThemeForRegion(region);

  // 2. Fetch buildings + roads via Overpass
  const overpassQuery = `[out:json][timeout:25];(way["building"](around:500,${centerLat},${centerLon});way["highway"](around:500,${centerLat},${centerLon}););out body;>;out skel qt;`;

  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
  const osmRes = await fetch(overpassUrl);

  if (!osmRes.ok) {
    throw new Error("Map data service unavailable. Try again shortly.");
  }

  const osmData = await osmRes.json();

  // 3. Parse nodes
  const nodeMap = new Map<number, { lat: number; lon: number }>();
  for (const el of osmData.elements) {
    if (el.type === "node") {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }

  // 4. Parse ways
  const buildings: Building[] = [];
  const buildingPolygons: Array<{ x: number; z: number }[]> = [];
  const roads: Road[] = [];

  for (const el of osmData.elements) {
    if (el.type !== "way" || !el.nodes?.length) continue;

    const coords = el.nodes
      .map((nid: number) => nodeMap.get(nid))
      .filter(Boolean) as Array<{ lat: number; lon: number }>;

    if (coords.length === 0) continue;

    if (el.tags?.building) {
      // Compute centroid
      const avgLat =
        coords.reduce(
          (s: number, c: { lat: number; lon: number }) => s + c.lat,
          0,
        ) / coords.length;
      const avgLon =
        coords.reduce(
          (s: number, c: { lat: number; lon: number }) => s + c.lon,
          0,
        ) / coords.length;
      const { x, z } = latLonToLocal(avgLat, avgLon, centerLat, centerLon);

      // Extract polygon (all nodes converted to local coords)
      const polygon = coords.map((c) =>
        latLonToLocal(c.lat, c.lon, centerLat, centerLon),
      );

      // Estimate bounding box for collision/fallback size
      const lats = coords.map((c: { lat: number; lon: number }) => c.lat);
      const lons = coords.map((c: { lat: number; lon: number }) => c.lon);
      const dLat = (Math.max(...lats) - Math.min(...lats)) * 110540;
      const dLon =
        (Math.max(...lons) - Math.min(...lons)) *
        111320 *
        Math.cos((centerLat * Math.PI) / 180);

      const sizeX = Math.max(dLon, 4);
      const sizeZ = Math.max(dLat, 4);

      // Height from OSM tags
      let sizeY: number;
      if (el.tags?.height) {
        sizeY = Math.max(3, Number.parseFloat(el.tags.height) || 6);
      } else if (el.tags?.["building:levels"]) {
        sizeY = Math.max(
          3,
          (Number.parseFloat(el.tags["building:levels"]) || 1) * 3.5,
        );
      } else {
        // Area-based estimate
        const area = sizeX * sizeZ;
        const heightSeed = Math.abs(Math.sin(x * 0.3 + z * 0.7));
        if (area > 2000) {
          sizeY = 8 + heightSeed * 30;
        } else if (area > 500) {
          sizeY = 5 + heightSeed * 15;
        } else {
          sizeY = 3 + heightSeed * 8;
        }
      }

      buildings.push({
        position: { x, y: 0, z },
        size: { x: sizeX, y: sizeY, z: sizeZ },
      });
      buildingPolygons.push(polygon);
    } else if (el.tags?.highway) {
      const path = coords.map((c: { lat: number; lon: number }) => {
        const { x, z } = latLonToLocal(c.lat, c.lon, centerLat, centerLon);
        return { x, y: 0.05, z };
      });

      if (path.length >= 2) {
        roads.push({
          id: BigInt(el.id),
          name: el.tags?.name || el.tags?.highway || "road",
          path,
        });
      }
    }
  }

  return {
    locationName: shortName,
    buildings: buildings.slice(0, 300),
    buildingPolygons: buildingPolygons.slice(0, 300),
    roads: roads.slice(0, 200),
    theme,
  };
}
