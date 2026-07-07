import { map, mapboxgl, mapLoaded } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";

const earthRadius = 6371.0087714;
const epicenterIconSize = 30 / 31;
const emptyFeatureCollection = Object.freeze({
  type: "FeatureCollection",
  features: [],
});

let currentYahooEEWBounds = null;
let epicenterImagePromise = null;

/**
 * Parses a coordinate string and converts it into decimal degrees.
 *
 * @private
 *
 * @param {String} coordStr Coordinate string (example: N11.2 or E32)
 *
 * @returns {Number|null} Parsed coordinate in decimal degrees, or null if invalid
 */
function parseCoordinate(coordStr) {
  if (!coordStr) return null;
  const direction = coordStr.charAt(0);
  const value = parseFloat(coordStr.substring(1));
  if (isNaN(value)) return null;
  return direction === "S" || direction === "W" ? -value : value;
}

/**
 * Creates a GeoJSON circle feature.
 *
 * @private
 *
 * @param {Array} center [longitude, latitude] of the circle's center
 * @param {Number} radiusInKm Radius of the circle in kilometers
 * @param {Number} points Number of points to use for the circle geometry
 * @returns {Object} GeoJSON feature representing the circle
 */
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

/**
 * Extends the given bounds to include the area covered by a circle.
 *
 * @private
 *
 * @param {Array} center [longitude, latitude] of the circle's center
 * @param {Number} radiusInKm Radius of the circle in kilometers
 * @param {mapboxgl.LngLatBounds} bounds Bounds to extend
 *
 * @returns {void}
 */
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

/**
 * Ensures that the epicenter icon image is loaded and added to the map.
 *
 * @private
 *
 * @returns {Promise<void>} Resolves when the image is loaded and added to the map, or if it already exists
 */
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

/**
 * Initializes the necessary sources (if they don't exist) and layers for rendering Yahoo EEW data on the map.
 *
 * @private
 *
 * @returns {void}
 */
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

/**
 * Renders wave (a circle) on the map.
 *
 * @private
 *
 * @param {string} id Layer ID
 * @param {Array} center [longitude, latitude] of the wave's center
 * @param {Number} radius Radius of the wave in kilometers
 * @param {mapboxgl.LngLatBounds} bounds Bounds to extend
 *
 * @returns {void}
 */
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

/**
 * Returns the current bounds of the Yahoo EEW data on the map.
 *
 * @returns {mapboxgl.LngLatBounds|null} Current bounds of the Yahoo EEW layer
 */
export function getYahooEEWBounds() {
  return currentYahooEEWBounds;
}

/**
 * Clears the Yahoo EEW sources by setting them to empty data and resets the current bounds.
 *
 * @private
 *
 * @returns {void}
 */
function clearEEWSources() {
  ["yahoo-eew-pwave", "yahoo-eew-swave", "yahoo-eew-epicenter"].forEach(
    (id) => {
      const src = map.getSource(id);
      if (src) src.setData(emptyFeatureCollection);
    },
  );
  currentYahooEEWBounds = null;
}

/**
 * Renders Yahoo EEW data on the map.
 *
 * @param {Object} eewData JSON data containing EEW information
 *
 * @returns {Promise<void>}
 */
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

  await mapLoaded;
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
