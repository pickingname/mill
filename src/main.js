console.log("JS is working!");
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN;
var map = new mapboxgl.Map({
  container: "map",
  attributionControl: false,
});

const nav = new mapboxgl.NavigationControl({
  showCompass: true,
  showZoom: true,
  visualizePitch: false,
});

map.addControl(nav);
map.addControl(nav, "top-right");
