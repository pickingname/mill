import L from "leaflet";
import Minimap from "../../lib/minimap.js";
import getMapPreset from "../date/getMapPreset.js";
import { startMainLoop } from "../main.js";

let map;

export function initMap() {
  // Initialize Leaflet map with OpenStreetMap tiles
  map = L.map("map", {
    center: [34.7666345, 136.073149],
    zoom: 6,
    zoomControl: false,
    attributionControl: false,
    fadeAnimation: false
  });

  // Add OpenStreetMap tile layer
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  });
  
  tileLayer.addTo(map);

  // Initialize map after tiles are loaded
  map.whenReady(function () {
    const minimap = new Minimap({
      lineColor: "#FF0000",
      lineWidth: 2,
      lineOpacity: getMapPreset() === "day" ? 0.5 : 1 || 1,
      fillOpacity: 0,
      center: [34.7666345, 136.073149],
      zoom: 2,
      width: "100%",
      height: "120px",
    });

    const sidebar = document.getElementById("sidebar");
    const minimapContainer = document.createElement("div");
    minimapContainer.id = "minimap-container";
    minimapContainer.className = "p-4 hidden md:block";
    sidebar.appendChild(minimapContainer);

    minimap.onAdd(map);
    minimapContainer.appendChild(minimap._container);

    if (minimap._miniMap) {
      minimap._miniMap.invalidateSize();
    }
  });

  // Start the main data loop
  map.whenReady(async () => {
    startMainLoop();
  });
}

export { map, L as leaflet };
