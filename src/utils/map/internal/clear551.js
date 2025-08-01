import { map, leaflet } from "../initMap.js";

// Global layer groups for managing map layers
let currentLayers = {
  prefsLayer: null,
  epicenterIcon: null, 
  stationsLayer: null,
  eewAreasLayer: null
};

export default function clear551() {
  // Remove all current layers
  Object.values(currentLayers).forEach(layer => {
    if (layer && map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  });
  
  // Reset layer references
  currentLayers = {
    prefsLayer: null,
    epicenterIcon: null,
    stationsLayer: null, 
    eewAreasLayer: null
  };
}

export { currentLayers };
