import { config } from "../../config";
import { map, L } from "../initMap.js";
import { getTsunamiBounds } from "../renderConditions/tsunami_forecast/ts.js";

export function internalBound(bound) {
  const tsunamiBounds = getTsunamiBounds && getTsunamiBounds();
  let mergedBounds = bound;

  if (!bound || typeof bound.extend !== "function") {
    if (bound && bound.getNorthEast && bound.getSouthWest) {
      mergedBounds = L.latLngBounds(
        bound.getSouthWest(),
        bound.getNorthEast()
      );
    } else {
      throw new Error(
        "internalBound: Provided bound is not a valid LatLngBounds"
      );
    }
  } else {
    mergedBounds = L.latLngBounds(bound);
  }
  
  if (tsunamiBounds && tsunamiBounds.isValid()) {
    mergedBounds.extend(tsunamiBounds.getNorthEast());
    mergedBounds.extend(tsunamiBounds.getSouthWest());
  }
  
  map.fitBounds(mergedBounds, {
    padding: config.map.bound_padding || [20, 20],
    animate: true,
    duration: (config.map.bound_duration || 1000) / 1000,
    maxZoom: 7,
  });
}
