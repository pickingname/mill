import L from "leaflet";
import { createMinimap } from "../../lib/minimap.js";
import getMapPreset from "../date/getMapPreset.js";
import { startMainLoop } from "../main.js";

let map;
let minimap = null;

/**
 * Initializes the Leaflet map with OpenStreetMap tiles and specified configuration.
 *
 * Sets up the map container, tiles, center, zoom level, and other properties.
 * And also initializes the minimap and sets up the map's drag/zoom behavior.
 * Then starts the main loop for data fetching and rendering.
 */
export function initMap() {
  // Initialize Leaflet map
  map = L.map("map", {
    center: [34.7666345, 136.073149],
    zoom: 4,
    zoomControl: false,
    attributionControl: false,
    maxBounds: [
      [20, 120], // Southwest corner
      [50, 155]  // Northeast corner (roughly Japan bounds)
    ]
  });

  // Add OpenStreetMap tiles based on theme
  const mapPreset = getMapPreset() || "day";
  let tileLayerUrl;
  let tileLayerOptions = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  };
  
  if (mapPreset === "night" || mapPreset === "dusk") {
    // Use CartoDB dark tiles for night/dusk themes
    tileLayerUrl = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png";
    tileLayerOptions.subdomains = ['a', 'b', 'c', 'd'];
  } else {
    // Use CartoDB light tiles for day/dawn themes (alternative to OSM)
    tileLayerUrl = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
    tileLayerOptions.subdomains = ['a', 'b', 'c', 'd'];
  }

  const tileLayer = L.tileLayer(tileLayerUrl, tileLayerOptions);
  
  tileLayer.addTo(map);

  // Set up minimap after map is initialized
  map.whenReady(function() {
    try {
      minimap = createMinimap({
        lineColor: "#FF0000",
        lineWidth: 2,
        lineOpacity: mapPreset === "day" ? 0.5 : 1,
        fillOpacity: 0,
        center: [34.7666345, 136.073149],
        zoom: 2,
        width: "100%",
        height: "120px",
        toggleDisplay: true
      });

      const sidebar = document.getElementById("sidebar");
      if (sidebar && minimap) {
        const minimapContainer = document.createElement("div");
        minimapContainer.id = "minimap-container";
        minimapContainer.className = "p-4 hidden md:block";
        sidebar.appendChild(minimapContainer);

        const minimapElement = minimap.getContainer();
        if (minimapElement) {
          minimapContainer.appendChild(minimapElement);
          minimap.addTo(map);
        }
      }
    } catch (error) {
      console.warn("[initMap] Error creating minimap:", error);
    }

    // Start the main data loop
    startMainLoop();
  });

  // Handle any tile loading errors
  tileLayer.on('tileerror', function(e) {
    console.warn('[initMap] Tile loading error:', e);
  });
}

export { map, L };
export { L as mapboxgl }; // Export L as mapboxgl for backward compatibility
