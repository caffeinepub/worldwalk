import type { Building, Road } from "../backend";

export interface OsmResult {
  locationName: string;
  buildings: Building[];
  roads: Road[];
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
  // Use short name: first 2 parts of display_name
  const shortName = displayName.split(",").slice(0, 2).join(",").trim();

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

      // Estimate building size
      const lats = coords.map((c: { lat: number; lon: number }) => c.lat);
      const lons = coords.map((c: { lat: number; lon: number }) => c.lon);
      const dLat = (Math.max(...lats) - Math.min(...lats)) * 110540;
      const dLon =
        (Math.max(...lons) - Math.min(...lons)) *
        111320 *
        Math.cos((centerLat * Math.PI) / 180);

      const sizeX = Math.max(dLon, 4);
      const sizeZ = Math.max(dLat, 4);
      // Vary height based on position for visual interest
      const heightSeed = Math.abs(Math.sin(x * 0.3 + z * 0.7));
      const sizeY = 3 + heightSeed * 12;

      buildings.push({
        position: { x, y: 0, z },
        size: { x: sizeX, y: sizeY, z: sizeZ },
      });
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
    roads: roads.slice(0, 200),
  };
}
