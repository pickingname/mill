import { config } from "../../config";
import { map, L } from "../initMap.js";
import { getTsunamiBounds } from "../renderConditions/tsunami_forecast/ts.js";

/**
 * Internal function to fit the map camera to a given bounds.
 * This was made so we don't need to pass the arguments every time we want to do bound actions.
 * Configured to make the bound to do quick smooth linear zooming into the bounds with max zoom level of 7.
 *
 * @param {L.LatLngBounds} bound The bounds to fit the camera to.
 */
export function internalBound(bound) {
  const tsunamiBounds = getTsunamiBounds && getTsunamiBounds();
  let mergedBounds = bound;

  if (!bound || typeof bound.extend !== "function") {
    throw new Error(
      "internalBound: Provided bound is not a valid LatLngBounds"
    );
  }

  // Clone the bounds if needed
  if (bound.toBBoxString) {
    mergedBounds = L.latLngBounds(bound.getSouthWest(), bound.getNorthEast());
  }

  if (tsunamiBounds && tsunamiBounds.isValid && tsunamiBounds.isValid()) {
    mergedBounds.extend(tsunamiBounds.getNorthEast());
    mergedBounds.extend(tsunamiBounds.getSouthWest());
  }

  // Convert padding from pixel value to appropriate margin
  const paddingOptions = {
    padding: [config.map.bound_padding, config.map.bound_padding]
  };

  if (config.map.bound_duration > 0) {
    paddingOptions.animate = true;
    paddingOptions.duration = config.map.bound_duration / 1000; // Convert to seconds
  }

  map.fitBounds(mergedBounds, {
    ...paddingOptions,
    maxZoom: 7
  });
}
