import mapboxgl from "mapbox-gl";
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
    config: {
      basemap: {
        lightPreset: getMapPreset() || "day",
        showPointOfInterestLabels: false,
        showPedestrianRoads: false,
        showLandmarkIcons: true,
        antialiasing: true,
      },
    },
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  /*map.on('style.load', () => {
    map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1 });
  });*/

  map.on("load", async () => {
    /*const response = await fetch("/assets/map/bounds.json");
    const geojson = await response.json();

    const bounds = new mapboxgl.LngLatBounds();
    geojson.features[0].geometry.coordinates[0].forEach((coord) => {
      bounds.extend(coord);
    });

    map.fitBounds(bounds, {
      padding: config.map.bound_padding,
      duration: 0,
    });*/

    startMainLoop();
  });
}

export { map, mapboxgl };
