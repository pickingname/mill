import { map } from "../initMap";

// Global layer references for cleanup
let prefsLayer = null;
let epicenterLayer = null;
let stationsLayer = null; 
let eewAreasLayer = null;

/**
 * Register a layer for cleanup
 * @param {string} layerName - The name of the layer
 * @param {L.Layer} layer - The Leaflet layer instance
 */
export function registerLayer(layerName, layer) {
  switch (layerName) {
    case "prefsLayer":
      prefsLayer = layer;
      break;
    case "epicenterIcon":
      epicenterLayer = layer;
      break;
    case "stationsLayer":
      stationsLayer = layer;
      break;
    case "eewAreasLayer":
      eewAreasLayer = layer;
      break;
  }
}

/**
 * Iterate and clears all 551 response code related layers from the map.
 *
 * Includes everything related to the 551 response code except for the tsunami layers.
 * This is used to reset the map state when a new 551 response code is received.
 */
export default function clear551() {
  const layers = [
    { name: "prefsLayer", layer: prefsLayer },
    { name: "epicenterIcon", layer: epicenterLayer },
    { name: "stationsLayer", layer: stationsLayer },
    { name: "eewAreasLayer", layer: eewAreasLayer }
  ];

  layers.forEach(({ name, layer }) => {
    if (layer && map.hasLayer(layer)) {
      map.removeLayer(layer);
      // Clear the reference
      switch (name) {
        case "prefsLayer":
          prefsLayer = null;
          break;
        case "epicenterIcon":
          epicenterLayer = null;
          break;
        case "stationsLayer":
          stationsLayer = null;
          break;
        case "eewAreasLayer":
          eewAreasLayer = null;
          break;
      }
    }
  });
}
