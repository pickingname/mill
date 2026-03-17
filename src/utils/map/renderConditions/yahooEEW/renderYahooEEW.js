import { map, mapboxgl } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";

const earthRadius = 6371.0087714;
const epicenterIconSize = 30 / 31;
const emptyFeatureCollection = Object.freeze({
  type: "FeatureCollection",
  features: [],
});

let currentYahooEEWBounds = null;
let epicenterImagePromise = null;

function parseCoordinate(coordStr) {
  if (!coordStr) return null;
  const direction = coordStr.charAt(0);
  const value = parseFloat(coordStr.substring(1));
  if (isNaN(value)) return null;
  return direction === "S" || direction === "W" ? -value : value;
}

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const coords = [];
  const d = radiusInKm / earthRadius;
  const lat1 = (center[1] * Math.PI) / 180;
  const lon1 = (center[0] * Math.PI) / 180;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinD = Math.sin(d);
  const cosD = Math.cos(d);

  for (let i = 0; i <= points; i++) {
    const brng = ((i * 360) / points) * (Math.PI / 180);
    const lat2 = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(brng));
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * sinD * cosLat1,
        cosD - sinLat1 * Math.sin(lat2),
      );
    coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

function extendBoundsWithCircle(center, radiusInKm, bounds) {
  const d = radiusInKm / earthRadius;
  const lat1 = (center[1] * Math.PI) / 180;
  const lon1 = (center[0] * Math.PI) / 180;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinD = Math.sin(d);
  const cosD = Math.cos(d);

  for (const brng of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const lat2 = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(brng));
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * sinD * cosLat1,
        cosD - sinLat1 * Math.sin(lat2),
      );
    bounds.extend([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
}

function ensureEpicenterImage() {
  if (!epicenterImagePromise) {
    epicenterImagePromise = new Promise((resolve) => {
      map.loadImage("/assets/basemap/icons/epicenter.png", (error, image) => {
        if (error) {
          console.error(
            "[renderYahooEEW] Failed to load epicenter icon",
            error,
          );
          resolve();
          return;
        }
        if (!map.hasImage("epicenter")) map.addImage("epicenter", image);
        resolve();
      });
    });
  }
  return epicenterImagePromise;
}

function initSources() {
  const waveLayerDefs = [
    {
      id: "yahoo-eew-pwave",
      paint: {
        "line-color": "#35b4fb",
        "line-width": 1,
        "line-emissive-strength": 1,
      },
    },
    {
      id: "yahoo-eew-swave",
      paint: {
        "line-color": "#f6521f",
        "line-width": 1,
        "line-emissive-strength": 1,
      },
    },
  ];

  for (const { id, paint } of waveLayerDefs) {
    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data: emptyFeatureCollection });
      map.addLayer({ id, type: "line", source: id, paint });
    }
  }

  if (!map.getSource("yahoo-eew-epicenter")) {
    map.addSource("yahoo-eew-epicenter", {
      type: "geojson",
      data: emptyFeatureCollection,
    });
    map.addLayer({
      id: "yahoo-eew-epicenter",
      type: "symbol",
      source: "yahoo-eew-epicenter",
      layout: {
        "icon-image": "epicenter",
        "icon-size": epicenterIconSize,
        "icon-allow-overlap": true,
      },
    });
  }
}

function renderWave(id, center, radius, bounds) {
  const src = map.getSource(id);
  if (!src) return;

  if (!isNaN(radius) && radius > 0) {
    src.setData({
      type: "FeatureCollection",
      features: [createGeoJSONCircle(center, radius)],
    });
    extendBoundsWithCircle(center, radius, bounds);
  } else {
    src.setData(emptyFeatureCollection);
  }
}

export function getYahooEEWBounds() {
  return currentYahooEEWBounds;
}

function clearEEWSources() {
  ["yahoo-eew-pwave", "yahoo-eew-swave", "yahoo-eew-epicenter"].forEach(
    (id) => {
      const src = map.getSource(id);
      if (src) src.setData(emptyFeatureCollection);
    },
  );
  currentYahooEEWBounds = null;
}

export async function renderYahooEEW(eewData) {
  if (!eewData || !eewData.psWave || !eewData.hypoInfo) {
    clearEEWSources();
    return;
  }

  const psWaveItem = eewData.psWave.items?.[0];
  const hypoItem = eewData.hypoInfo.items?.[0];

  if (!psWaveItem || !hypoItem) {
    clearEEWSources();
    return;
  }

  const epicenterLat = parseCoordinate(hypoItem.latitude);
  const epicenterLng = parseCoordinate(hypoItem.longitude);

  if (epicenterLat === null || epicenterLng === null) {
    clearEEWSources();
    return;
  }

  const center = [epicenterLng, epicenterLat];
  const pRadius = parseFloat(psWaveItem.pRadius);
  const sRadius = parseFloat(psWaveItem.sRadius);

  await ensureEpicenterImage();
  initSources();

  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend(center);

  renderWave("yahoo-eew-pwave", center, pRadius, bounds);
  renderWave("yahoo-eew-swave", center, sRadius, bounds);

  map.getSource("yahoo-eew-epicenter").setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: center },
        properties: {},
      },
    ],
  });

  currentYahooEEWBounds = bounds;
  internalBound(bounds);
}
