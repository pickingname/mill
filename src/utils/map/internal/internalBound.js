import { config } from "../../config.js";
import { map, leaflet } from "../initMap.js";
import { getTsunamiBounds } from "../renderConditions/tsunami_forecast/ts.js";

export function internalBound(bound) {
  const tsunamiBounds = getTsunamiBounds && getTsunamiBounds();
  let finalBounds = bound;

  // Convert bound to Leaflet LatLngBounds if needed
  if (bound && bound.length === 2) {
    // If bound is in [lat, lng] format, create proper bounds
    finalBounds = leaflet.latLngBounds(bound);
  } else if (bound && bound.getSouthWest && bound.getNorthEast) {
    // Already a valid bounds object, use as is
    finalBounds = bound;
  } else if (!bound) {
    // Use default bounds from config
    finalBounds = leaflet.latLngBounds(config.map.main_bounds);
  }

  // Extend bounds with tsunami data if available
  if (tsunamiBounds) {
    finalBounds.extend(tsunamiBounds);
  }

  // Fit map to bounds with options
  map.fitBounds(finalBounds, {
    padding: [config.map.bound_padding, config.map.bound_padding],
    maxZoom: 7,
    animate: true,
    duration: config.map.bound_duration / 1000 // Convert to seconds
  });
}
