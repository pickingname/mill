import { config } from "../../config";
import { map, mapboxgl } from "../initMap.js";
import { getTsunamiBounds } from "../renderConditions/tsunami_forecast/ts.js";

/**
 * Internal function to fit the map camera to a given bounds.
 * This was made so we don't need to pass the arguments every time we want to do bound actions.
 * Configured to make the bound to do quick smooth linear zooming into the bounds with max zoom level of 7.
 *
 * @param {mapboxgl.LngLatBounds} bound The bounds to fit the camera to.
 */
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
    maxZoom: 7,
  });
}
