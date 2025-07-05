import mapboxgl from "mapbox-gl";
import getMapPreset from "../date/getMapPreset.js";
import { startMainLoop } from "../main.js";
import Minimap from "../../lib/minimap.js";

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
    interactive: false,
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
    map.addControl(
      new Minimap({
        lineColor: "#FF0000",
        lineWidth: 2,
        lineOpacity: 0.5,
        fillOpacity: 0,
        center: {
          lng: 136.073149,
          lat: 34.7666345,
        },
        zoom: 2,
      }),
      "bottom-right"
    );
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  map.on("load", async () => {
    startMainLoop();
  });
}

export { map, mapboxgl };
