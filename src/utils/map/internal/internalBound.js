import { config } from "../../config";
import { map, mapboxgl } from "../initMap.js";
import { getTsunamiBounds } from "../renderConditions/tsunami_forecast/ts.js";

export function internalBound(bound) {
  const tsunamiBounds = getTsunamiBounds && getTsunamiBounds();
  let mergedBounds = bound;

  if (!bound || typeof bound.clone !== "function") {
    if (bound && bound.getNorthEast && bound.getSouthWest) {
      mergedBounds = new mapboxgl.LngLatBounds(
        bound.getSouthWest(),
        bound.getNorthEast()
      );
    } else {
      throw new Error(
        "internalBound: Provided bound is not a valid LngLatBounds"
      );
    }
  } else {
    mergedBounds = bound.clone();
  }
  if (tsunamiBounds && !tsunamiBounds.isEmpty()) {
    mergedBounds.extend(tsunamiBounds.getNorthEast());
    mergedBounds.extend(tsunamiBounds.getSouthWest());
  }
  map.fitBounds(mergedBounds, {
    padding: config.map.bound_padding,
    duration: config.map.bound_duration,
    easing: (t) => 1 - Math.pow(1 - t, 5),
    linear: true,
    maxZoom: 8,
  });
}
