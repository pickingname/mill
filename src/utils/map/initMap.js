import mapboxgl from "mapbox-gl";
import Minimap from "../../lib/minimap.js";
import getMapPreset from "../date/getMapPreset.js";
import { startMainLoop } from "../main.js";

let map;

export function initMap() {
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN;
  map = new mapboxgl.Map({
    container: "map",
    attributionControl: false,
    style: "mapbox://styles/mapbox/standard?optimize=true",
    worldview: "jp",
    language: "en",
    center: {
      lng: 136.073149,
      lat: 34.7666345,
    },
    zoom: "4",
    projection: "mercator",
    interactive: true,
    fadeDuration: 0,
    config: {
      basemap: {
        lightPreset: getMapPreset() || "day",
        showPointOfInterestLabels: false,
        showPedestrianRoads: false,
        showLandmarkIcons: true,
      },
    },
  });

  map.on("load", function () {
    const minimap = new Minimap({
      lineColor: "#FF0000",
      lineWidth: 2,
      lineOpacity: getMapPreset() === "day" ? 0.5 : 1 || 1,
      fillOpacity: 0,
      center: {
        lng: 136.073149,
        lat: 34.7666345,
      },
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
      minimap._miniMap.resize();
    }
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1 });
  });

  map.on("load", async () => {
    map.resize();
    startMainLoop();
  });
}

export { map, mapboxgl };
