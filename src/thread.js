import mapboxgl from "mapbox-gl";
import getMapPreset from "./utils/date/getMapPreset";
import { config } from "./utils/config";

const lightPreset = getMapPreset();

console.log(lightPreset);

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN;
const map = new mapboxgl.Map({
  container: "map",
  attributionControl: false,
  style: "mapbox://styles/mapbox/standard?optimize=true",
  worldview: "jp",
  language: "en",
  center: {
    lng: 136.073149,
    lat: 34.7666345,
  },
  zoom: "3",
  config: {
    basemap: {
      lightPreset: lightPreset,
      showPointOfInterestLabels: false,
      showPedestrianRoads: false,
    },
  },
});

map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

map.on("load", async () => {
  const response = await fetch("/assets/geojsons/bounds.json");
  const geojson = await response.json();

  const bounds = new mapboxgl.LngLatBounds();
  geojson.features[0].geometry.coordinates[0].forEach((coord) => {
    bounds.extend(coord);
  });

  map.fitBounds(bounds, {
    padding: config.MAP.DEFAULT_BOUND_PADDING,
    duration: 0,
  });
});

export { map, mapboxgl };
